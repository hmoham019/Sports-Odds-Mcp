# Odds API Integration Project

## Overview

This project provides a comprehensive integration with The Odds API (https://the-odds-api.com/) to fetch sports betting odds and player props data. The system is designed primarily for MLB (Major League Baseball) games and includes multiple server implementations and MCP (Model Context Protocol) tools.

## Key Features

- **Real-time Sports Odds**: Fetch current odds for multiple sports including MLB, NBA, NFL, NHL, and soccer
- **Player Props Integration**: Specialized tools for fetching player proposition bets (home runs, strikeouts, etc.)
- **Multiple Server Implementations**: Various server configurations for different deployment scenarios
- **MCP Protocol Support**: Tools designed to work with Model Context Protocol for AI integration
- **DraftKings Integration**: Specific support for DraftKings sportsbook data



## Configuration

### API Key Configuration

The project requires a The Odds API key. Get your free API key from [The Odds API](https://the-odds-api.com/).

### Environment Variables

Create a `.env` file in the root directory:

```
ODDS_API_KEY=your_api_key_here
PORT=10000
NODE_ENV=production
```

**Important**: Never commit your `.env` file to version control. Use `env.example` as a template.

## Available Sports

The system supports the following sports:
- `baseball_mlb` - Major League Baseball
- `basketball_nba` - National Basketball Association
- `basketball_wnba` - Women's National Basketball Association
- `americanfootball_nfl` - National Football League
- `icehockey_nhl` - National Hockey League
- `soccer_epl` - English Premier League

## MCP Tools

### 1. fetch_sports_odds
Fetches current odds for specified sports.

**Parameters:**
- `sport` (required): Sport key (e.g., "baseball_mlb", "americanfootball_nfl", "icehockey_nhl")
- `markets` (optional): Array of market types (default: ["h2h"])
- `regions` (optional): Geographic regions (default: "us")

**Available Markets:**
- **Standard**: `h2h` (moneyline), `spreads`, `totals`, `outrights`
- **NFL Quarters**: `h2h_q1`, `h2h_q2`, `h2h_q3`, `h2h_q4`, `spreads_q1-4`, `totals_q1-4`
- **NHL Periods**: `h2h_p1`, `h2h_p2`, `h2h_p3`, `spreads_p1-3`, `totals_p1-3`

**Usage:**
```javascript
{
  "sport": "americanfootball_nfl",
  "markets": ["h2h", "spreads", "totals", "h2h_q1", "spreads_q1"],
  "regions": "us"
}
```

### 2. fetch_player_props
Fetches player proposition bets for MLB, WNBA, NFL, and NHL games.

**Parameters:**
- `sport` (required): Sport key ("baseball_mlb", "basketball_wnba", "americanfootball_nfl", "icehockey_nhl")
- `markets` (optional): Array of prop markets (sport-specific defaults)
- `team_filter` (optional): Filter by team name

**Available Markets by Sport:**

**MLB:**
- `batter_home_runs`, `batter_hits`, `batter_total_bases`, `batter_rbis`
- `pitcher_strikeouts`, `pitcher_walks`, `pitcher_hits_allowed`

**WNBA:**
- `player_points`, `player_rebounds`, `player_assists`, `player_blocks`, `player_steals`

**NFL:**
- `player_pass_yds`, `player_pass_tds`, `player_rush_yds`, `player_rush_tds`
- `player_receptions`, `player_reception_yds`, `player_sacks`, `player_tackles`

**NHL:**
- `player_points`, `player_goals`, `player_assists`, `player_shots_on_goal`
- `player_blocked_shots`, `player_total_saves`

**Usage:**
```javascript
{
  "sport": "americanfootball_nfl",
  "markets": ["player_pass_yds", "player_rush_yds"],
  "team_filter": "Chiefs"
}
```

## Server Implementations

### 1. Standard MCP Server (`src/mcp-server.js`)
- Standard MCP server using stdio transport
- Supports both odds and player props tools
- Designed for command-line usage

### 2. HTTP MCP Server (`http-mcp-server.js`)
- HTTP-based MCP server
- Stateless operation
- CORS enabled for web integration
- Port: 3002 (configurable)

### 3. HTTP MCP Server Fixed (`http-mcp-server-fixed.js`)
- Enhanced HTTP MCP server with session management
- Supports persistent connections
- Better error handling
- SSE (Server-Sent Events) support

### 4. Genspark MCP Server (`genspark-mcp-server.js`)
- Specialized implementation for Genspark integration
- Custom tool configurations
- Enhanced logging and debugging

## API Integration

### Base URL
```
https://api.the-odds-api.com/v4
```

### Main Endpoints Used
- `/sports/{sport}/odds` - Get odds for all games
- `/sports/{sport}/events` - Get upcoming events
- `/sports/{sport}/events/{event_id}/odds` - Get odds for specific event

### Bookmaker Focus
The system is optimized for DraftKings data but can be configured for other bookmakers supported by The Odds API.

## Recent Changes

### API Key Update (Latest)
- **Date**: Current deployment
- **Change**: Updated all API key references from multiple old keys to the new unified key: `a5a760342df8774d16f2e6aed9aaeffe`
- **Files Updated**: 
  - `.env`
  - `src/config.js`
  - `dist/config.js`
  - `src/mcp-server.js`
  - `dist/mcp-server.js`
  - `http-mcp-server.js`
  - `http-mcp-server-fixed.js`
  - `genspark-mcp-server.js`
  - `test-tool.js`
  - `src/apiService.js` (already had correct key)

### Security Improvements
- Consolidated multiple API keys into a single key
- Environment variable support for API key configuration
- Removed hardcoded keys from multiple locations

## Running the Project

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation
```bash
npm install
```

### Starting the HTTP Server
```bash
node http-mcp-server.js
```

### Testing
```bash
node test-tool.js
```

### Health Check
```bash
curl http://localhost:3002/health
```

## Error Handling

The system includes comprehensive error handling for:
- API rate limits
- Invalid API responses
- Network connectivity issues
- Missing or invalid game data
- Bookmaker data unavailability

## Rate Limits

The Odds API has rate limits. The system is designed to handle:
- Standard rate limiting with appropriate error messages
- Graceful degradation when limits are exceeded
- Retry logic for transient failures

## Contributing

When making changes to the project:
1. Update the API key in the `.env` file
2. Ensure all server implementations are updated
3. Test all MCP tools functionality
4. Update this README with any new features or changes

## License

This project is for educational and development purposes. Please review The Odds API terms of service for commercial usage requirements.

## Support

For issues with The Odds API integration, check:
- The Odds API documentation: https://the-odds-api.com/liveapi/guides/v4/
- API status page for service availability
- Rate limit documentation for usage guidelines