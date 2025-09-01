#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const app = express();
const port = process.env.PORT || 10000;

// Track active transports by session ID
const transports = {};

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id'],
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Create server factory function
const createServer = () => {
  const server = new McpServer(
    {
      name: "odds-api-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register the sports odds tool
  server.registerTool("fetch_sports_odds", {
    title: "Sports Odds Fetcher",
    description: "Fetches sports odds from The Odds API. Gets all current games for a specified sport with odds from US bookmakers.",
    inputSchema: {
      sport: z.enum(["baseball_mlb", "basketball_nba", "basketball_wnba", "basketball_wnba", "americanfootball_nfl", "icehockey_nhl", "soccer_epl"])
        .describe("The sport key (e.g., 'baseball_mlb', 'basketball_nba', 'basketball_wnba', 'americanfootball_nfl'). Use 'baseball_mlb' for MLB games, 'basketball_wnba' for WNBA games."),
      markets: z.array(z.string())
        .optional()
        .default(["h2h"])
        .describe("Market types to fetch (e.g., 'h2h' for moneyline, 'spreads', 'totals'). For player props, check API docs for specific keys."),
      regions: z.string()
        .optional()
        .default("us")
        .describe("Geographic regions for bookmakers. Use 'us' for US bookmakers like DraftKings, FanDuel.")
    }
  }, async ({ sport, markets = ["h2h"], regions = "us" }) => {
    try {
      console.error('\n=== SPORTS ODDS TOOL DEBUG ===');
      console.error('Sport:', sport);
      console.error('Markets:', markets);
      console.error('Regions:', regions);
      console.error('========================\n');
      
      // Make direct API call using the correct Odds API structure
      const apiKey = 'e2589acbc9f5ed09664e15a3fd90682d';
      const baseUrl = 'https://api.the-odds-api.com/v4';
      
      const url = `${baseUrl}/sports/${sport}/odds/?apiKey=${apiKey}&regions=${regions}&markets=${markets.join(',')}&oddsFormat=decimal&dateFormat=iso`;
      
      console.error('Making API call to:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid API response: expected array of games');
      }
      
      let result = `Sports Odds Report - ${sport.toUpperCase()}\n`;
      result += `Generated: ${new Date().toLocaleString()}\n`;
      result += `Markets: ${markets.join(', ')}\n`;
      result += `Regions: ${regions}\n\n`;
      
      if (data.length === 0) {
        result += 'No games found for this sport.\n';
      } else {
        result += `Found ${data.length} games:\n\n`;
        
        data.forEach((game, index) => {
          result += `${index + 1}. ${game.away_team} @ ${game.home_team}\n`;
          result += `   Starts: ${new Date(game.commence_time).toLocaleString()}\n`;
          
          if (game.bookmakers && game.bookmakers.length > 0) {
            game.bookmakers.forEach(bookmaker => {
              result += `   ${bookmaker.title}:\n`;
              bookmaker.markets.forEach(market => {
                result += `     ${market.key}: `;
                market.outcomes.forEach((outcome, i) => {
                  if (i > 0) result += ', ';
                  result += `${outcome.name} (${outcome.price})`;
                  if (outcome.point) result += ` ${outcome.point}`;
                });
                result += '\n';
              });
            });
          }
          result += '\n';
        });
      }
      
      return {
        content: [{
          type: "text",
          text: result
        }]
      };
    } catch (error) {
      console.error(`Error executing tool fetch_sports_odds:`, error);
      throw new Error(`Failed to execute fetch_sports_odds: ${error.message}`);
    }
  });

  // Register the player props tool  
  server.registerTool("fetch_player_props", {
    title: "Player Props Fetcher", 
    description: "Fetches player props for specific MLB or WNBA games from DraftKings using the correct event-specific endpoint",
    inputSchema: {
      sport: z.enum(["baseball_mlb", "basketball_wnba"]).describe("Sport key - baseball_mlb or basketball_wnba supported"),
      markets: z.array(z.string()).optional().default(["batter_home_runs", "pitcher_strikeouts"]).describe("Player prop markets. MLB: batter_home_runs, batter_hits, batter_total_bases, batter_rbis, pitcher_strikeouts, pitcher_walks, pitcher_hits_allowed. WNBA: player_points, player_rebounds, player_assists"),
      team_filter: z.string().optional().describe("Filter games by team name (e.g., 'Yankees', 'Blue Jays')")
    }
  }, async ({ sport, markets, team_filter }) => {
    // Set default markets based on sport
    if (!markets) {
      markets = sport === "basketball_wnba" ? ["player_points", "player_rebounds", "player_assists"] : ["batter_home_runs", "pitcher_strikeouts"];
    }
    try {
      console.error('\n=== PLAYER PROPS TOOL DEBUG ===');
      console.error('Sport:', sport);
      console.error('Markets:', markets);
      console.error('Team filter:', team_filter);
      console.error('========================\n');
      
      const apiKey = 'e2589acbc9f5ed09664e15a3fd90682d';
      const baseUrl = 'https://api.the-odds-api.com/v4';
      
      // Step 1: Get all events for the sport
      console.error('Fetching events for', sport);
      const eventsResponse = await fetch(`${baseUrl}/sports/${sport}/events?apiKey=${apiKey}`);
      if (!eventsResponse.ok) {
        throw new Error(`Events API call failed: ${eventsResponse.status}`);
      }
      const events = await eventsResponse.json();
      
      console.error(`Found ${events.length} total events`);
      
      // Step 2: Filter events if team_filter provided
      let filteredEvents = events;
      if (team_filter) {
        filteredEvents = events.filter(event => 
          event.home_team.toLowerCase().includes(team_filter.toLowerCase()) ||
          event.away_team.toLowerCase().includes(team_filter.toLowerCase())
        );
        console.error(`After filtering by "${team_filter}": ${filteredEvents.length} events`);
      }
      
      // Step 3: Get player props for each event
      let result = `Player Props Report - ${sport.toUpperCase()}\n`;
      result += `Generated: ${new Date().toLocaleString()}\n`;
      result += `Markets: ${markets.join(', ')}\n`;
      if (team_filter) result += `Team Filter: ${team_filter}\n`;
      result += `\n`;
      
      if (filteredEvents.length === 0) {
        result += team_filter ? 
          `No games found for team "${team_filter}" today.\n` : 
          'No games found for this sport today.\n';
        return {
          content: [{ type: "text", text: result }]
        };
      }
      
      // Limit to first 3 games to avoid too much data
      const gamesToProcess = filteredEvents.slice(0, 3);
      result += `Processing ${gamesToProcess.length} games:\n\n`;
      
      for (const event of gamesToProcess) {
        try {
          console.error(`Fetching props for ${event.away_team} @ ${event.home_team}`);
          const propsUrl = `${baseUrl}/sports/${sport}/events/${event.id}/odds?apiKey=${apiKey}&regions=us&markets=${markets.join(',')}&bookmakers=draftkings`;
          
          console.error('Props URL:', propsUrl);
          
          const propsResponse = await fetch(propsUrl);
          if (!propsResponse.ok) {
            console.error(`Props API call failed for event ${event.id}: ${propsResponse.status}`);
            result += `--- ${event.away_team} @ ${event.home_team} ---\n`;
            result += `Error: Unable to fetch props (${propsResponse.status})\n\n`;
            continue;
          }
          
          const propsData = await propsResponse.json();
          
          result += `--- ${event.away_team} @ ${event.home_team} ---\n`;
          result += `Starts: ${new Date(event.commence_time).toLocaleString()}\n`;
          
          if (propsData.bookmakers && propsData.bookmakers.length > 0) {
            const draftkings = propsData.bookmakers.find(b => b.key === 'draftkings');
            if (draftkings && draftkings.markets && draftkings.markets.length > 0) {
              draftkings.markets.forEach(market => {
                result += `\n${market.key.replace(/_/g, ' ').toUpperCase()}:\n`;
                market.outcomes.forEach(outcome => {
                  const playerName = outcome.description || outcome.name;
                  const betType = outcome.name;
                  const point = outcome.point ? ` ${outcome.point}` : '';
                  const odds = outcome.price;
                  result += `  ${playerName}: ${betType}${point} (${odds})\n`;
                });
              });
            } else {
              result += "No DraftKings props available for this game\n";
            }
          } else {
            result += "No bookmaker data available for this game\n";
          }
          result += '\n';
          
        } catch (eventError) {
          console.error(`Error fetching props for event ${event.id}:`, eventError);
          result += `--- ${event.away_team} @ ${event.home_team} ---\n`;
          result += `Error: ${eventError.message}\n\n`;
        }
      }
      
      return {
        content: [{
          type: "text",
          text: result
        }]
      };
      
    } catch (error) {
      console.error('Error in fetch_player_props:', error);
      throw new Error(`Failed to fetch player props: ${error.message}`);
    }
  });

  return server;
};

// MCP POST handler with session management
const mcpPostHandler = async (req, res) => {
  try {
    console.log('MCP POST request received');
    
    const sessionId = req.headers['mcp-session-id'];
    let transport = sessionId ? transports[sessionId] : null;
    
    // If no existing transport or this is an initialization request, create new transport
    if (!transport || isInitializeRequest(req.body)) {
      const newSessionId = sessionId || randomUUID();
      console.log(`Creating new transport for session ${newSessionId}`);
      
      transport = new StreamableHTTPServerTransport({
        httpVersion: '1.1',
        keepAlive: false,
        requestTimeoutMs: 30000,
        maxRequestsPerConnection: 100
      });
      
      transport.sessionId = newSessionId;
      transports[newSessionId] = transport;
      
      // Set up onclose handler to clean up transport when closed
      transport.onclose = () => {
        console.log(`Transport closed for session ${newSessionId}, removing from transports map`);
        delete transports[newSessionId];
      };
      
      // Connect the transport to the MCP server
      const server = createServer();
      await server.connect(transport);
    }
    
    // Handle the request
    await transport.handleRequest(req, res, req.body);
    console.log('MCP request processed successfully');
    
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error.message
        },
        id: null,
      });
    }
  }
};

// Set up MCP routes
app.post('/mcp', mcpPostHandler);

// Handle GET requests for SSE streams  
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  try {
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling SSE request:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing SSE request');
    }
  }
});

// Start the HTTP server
app.listen(port, '0.0.0.0', () => {
  console.log(`HTTP MCP Server running on http://0.0.0.0:${port}`);
  console.log(`MCP endpoint: http://0.0.0.0:${port}/mcp`);
  console.log(`Health check: http://0.0.0.0:${port}/health`);
  console.log(`Process ID: ${process.pid}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Try a different port or kill the process using it.`);
  }
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  // Close all active transports
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  console.log('Server shutdown complete');
  process.exit(0);
});
