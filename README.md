# Odds API Integration Project

## Overview

This project provides a comprehensive integration with The Odds API (https://the-odds-api.com/) to fetch sports betting odds and player props data. The system is designed primarily for MLB (Major League Baseball) games and includes multiple server implementations and MCP (Model Context Protocol) tools.

## Key Features

- **Real-time Sports Odds**: Fetch current odds for multiple sports including MLB, NBA, NFL, NHL, and soccer
- **Player Props Integration**: Specialized tools for fetching player proposition bets (home runs, strikeouts, etc.)
- **Multiple Server Implementations**: Various server configurations for different deployment scenarios
- **MCP Protocol Support**: Tools designed to work with Model Context Protocol for AI integration
- **DraftKings Integration**: Specific support for DraftKings sportsbook data

## Project Structure

```
oddsAPi/
├── src/
│   ├── config.js              # Main configuration file
│   ├── apiService.js          # Core API service functions
│   ├── mcp-server.js          # Primary MCP server implementation
│   ├── gameProcessor.js       # Game data processing logic
│   └── odds-api-integration.js # Main integration script
├── dist/
│   ├── config.js              # Compiled configuration
│   └── mcp-server.js          # Compiled MCP server
├── http-mcp-server.js         # HTTP-based MCP server
├── http-mcp-server-fixed.js   # Fixed HTTP MCP server implementation
├── genspark-mcp-server.js     # Genspark-specific MCP server
├── test-tool.js               # Testing utilities
├── .env                       # Environment variables
└── README.md                  # This file
```

## Configuration

### API Key Configuration

The project uses The Odds API key: `a5a760342df8774d16f2e6aed9aaeffe`

This key has been updated across all files in the project, including:
- Environment variables (`.env`)
- Configuration files (`src/config.js`, `dist/config.js`)
- All server implementations
- Test utilities

### Environment Variables

Create a `.env` file in the root directory:

```
ODDS_API_KEY=a5a760342df8774d16f2e6aed9aaeffe
```

## Available Sports

The system supports the following sports:
- `baseball_mlb` - Major League Baseball
- `basketball_nba` - National Basketball Association
- `americanfootball_nfl` - National Football League
- `icehockey_nhl` - National Hockey League
- `soccer_epl` - English Premier League

## MCP Tools

### 1. fetch_sports_odds
Fetches current odds for specified sports.

**Parameters:**
- `sport` (required): Sport key (e.g., "baseball_mlb")
- `markets` (optional): Array of market types (default: ["h2h"])
- `regions` (optional): Geographic regions (default: "us")

**Usage:**
```javascript
{
  "sport": "baseball_mlb",
  "markets": ["h2h", "spreads", "totals"],
  "regions": "us"
}
```

### 2. fetch_player_props
Fetches player proposition bets for MLB games.

**Parameters:**
- `sport` (required): Sport key (currently only "baseball_mlb")
- `markets` (optional): Array of prop markets (default: ["batter_home_runs", "pitcher_strikeouts"])
- `team_filter` (optional): Filter by team name

**Available Markets:**
- `batter_home_runs`
- `batter_hits`
- `batter_total_bases`
- `batter_rbis`
- `batter_runs_scored`
- `pitcher_strikeouts`
- `pitcher_walks`
- `pitcher_hits_allowed`

**Usage:**
```javascript
{
  "sport": "baseball_mlb",
  "markets": ["batter_home_runs", "pitcher_strikeouts"],
  "team_filter": "Yankees"
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