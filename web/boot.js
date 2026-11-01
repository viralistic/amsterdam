// Entry point of the single-player browser build (npm run build:web). Order matters: the network
// override first, then the game server, then the client.
import './net.js';
import '../server/index.js';
import '../public/js/main.js';
