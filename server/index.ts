import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { authenticate, optionalAuthenticate } from "./middleware/auth";

// Auth routes
import {
  getSpotifyAuthUrl,
  handleSpotifyCallback,
  refreshSpotifyToken,
  getCurrentUser,
  logout,
} from "./routes/auth";

// Music API routes (Spotify)
import {
  search,
  getTrack,
  getTracks,
  getAlbum,
  getAlbumTracks,
  getArtist,
  getArtistTopTracks,
  getArtistAlbums,
  getRelatedArtists,
  getPlaylist,
  getPlaylistTracks,
  getUserPlaylists,
  getSavedTracks,
  getSavedAlbums,
  getFollowedArtists,
  getTopItems,
  getTopArtists,
  getRecentlyPlayed,
  getFeaturedPlaylists,
  getNewReleases,
  getCategories,
  getCategoryPlaylists,
  getRecommendations,
  getGenreSeeds,
  checkSavedTracks,
  saveTracks,
  removeSavedTracks,
} from "./routes/spotify";


// Audio streaming routes
import {
  streamAudio,
  serveCachedAudio,
  getAudioMetadata,
  uploadAudioStream,
  getCacheStats,
  clearAudioCache
} from "./routes/audio";

// Library synchronization routes
import {
  syncLibrary,
  getSyncProgress,
  getUserLibrary,
  getLibraryStats,
  resyncPlaylist,
  recordPlayback,
  getListeningStats,
  followUser,
  unfollowUser,
  getUserFollowing,
  getUserFollowers,
  getActivityFeed,
  likeTrack,
  shareTrack
} from "./routes/library";

// Offline music routes
import {
  downloadTrack,
  getDownloadProgress,
  getUserDownloads,
  serveOfflineTrack,
  checkOfflineStatus,
  deleteOfflineTrack,
  getOfflineStats,
  cleanupOfflineStorage,
  getOfflineTracks,
  batchDownload,
  getOfflineTrackMetadata
} from "./routes/offline";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 
      ['https://vibetune.netlify.app', 'https://www.vibetune.app'] :
      ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Example API routes
  app.get("/api/demo", handleDemo);

  // Auth routes
  app.get("/api/auth/spotify/url", getSpotifyAuthUrl);
  app.get("/api/auth/spotify/callback", handleSpotifyCallback);
  app.post("/api/auth/refresh", authenticate, refreshSpotifyToken);
  app.get("/api/auth/user", authenticate, getCurrentUser);
  app.post("/api/auth/logout", authenticate, logout);

  // Public Spotify API routes (can work without auth using client credentials)
  app.get("/api/spotify/search", optionalAuthenticate, search);
  app.get("/api/spotify/track/:id", optionalAuthenticate, getTrack);
  app.get("/api/spotify/tracks", optionalAuthenticate, getTracks);
  app.get("/api/spotify/album/:id", optionalAuthenticate, getAlbum);
  app.get("/api/spotify/album/:id/tracks", optionalAuthenticate, getAlbumTracks);
  app.get("/api/spotify/artist/:id", optionalAuthenticate, getArtist);
  app.get("/api/spotify/artist/:id/top-tracks", optionalAuthenticate, getArtistTopTracks);
  app.get("/api/spotify/artist/:id/albums", optionalAuthenticate, getArtistAlbums);
  app.get("/api/spotify/artist/:id/related-artists", optionalAuthenticate, getRelatedArtists);
  app.get("/api/spotify/featured-playlists", optionalAuthenticate, getFeaturedPlaylists);
  app.get("/api/spotify/new-releases", optionalAuthenticate, getNewReleases);
  app.get("/api/spotify/categories", optionalAuthenticate, getCategories);
  app.get("/api/spotify/categories/:id/playlists", optionalAuthenticate, getCategoryPlaylists);
  app.get("/api/spotify/recommendations", optionalAuthenticate, getRecommendations);
  app.get("/api/spotify/genre-seeds", optionalAuthenticate, getGenreSeeds);

  // Protected Spotify API routes (require authentication)
  app.get("/api/spotify/playlist/:id", authenticate, getPlaylist);
  app.get("/api/spotify/playlist/:id/tracks", authenticate, getPlaylistTracks);
  app.get("/api/spotify/me/playlists", authenticate, getUserPlaylists);
  app.get("/api/spotify/me/tracks", authenticate, getSavedTracks);
  app.get("/api/spotify/me/albums", authenticate, getSavedAlbums);
  app.get("/api/spotify/me/following", authenticate, getFollowedArtists);
  app.get("/api/spotify/me/top/:type", authenticate, getTopItems);
  app.get("/api/spotify/top-artists", optionalAuthenticate, getTopArtists);
  app.get("/api/spotify/me/player/recently-played", authenticate, getRecentlyPlayed);
  app.get("/api/spotify/me/tracks/contains", authenticate, checkSavedTracks);
  app.put("/api/spotify/me/tracks", authenticate, saveTracks);
  app.delete("/api/spotify/me/tracks", authenticate, removeSavedTracks);

  // Audio streaming routes
  app.post("/api/audio/stream/:trackId", authenticate, streamAudio);
  app.get("/api/audio/cached/:trackId", authenticate, serveCachedAudio);
  app.get("/api/audio/metadata/:trackId", authenticate, getAudioMetadata);
  app.post("/api/audio/upload/:trackId", authenticate, uploadAudioStream);
  app.get("/api/audio/cache/stats", authenticate, getCacheStats);
  app.delete("/api/audio/cache/clear", authenticate, clearAudioCache);

  // Library synchronization routes
  app.post("/api/library/sync", authenticate, syncLibrary);
  app.get("/api/library/sync/progress", authenticate, getSyncProgress);
  app.get("/api/library", authenticate, getUserLibrary);
  app.get("/api/library/stats", authenticate, getLibraryStats);
  app.post("/api/library/playlist/:playlistId/resync", authenticate, resyncPlaylist);
  
  // Analytics routes
  app.post("/api/analytics/playback", authenticate, recordPlayback);
  app.get("/api/analytics/listening", authenticate, getListeningStats);
  
  // Social features routes
  app.post("/api/social/follow/:userId", authenticate, followUser);
  app.delete("/api/social/follow/:userId", authenticate, unfollowUser);
  app.get("/api/social/following", authenticate, getUserFollowing);
  app.get("/api/social/followers", authenticate, getUserFollowers);
  app.get("/api/social/activity", authenticate, getActivityFeed);
  app.post("/api/social/like", authenticate, likeTrack);
  app.post("/api/social/share", authenticate, shareTrack);

  // Offline music routes
  app.post("/api/offline/download", authenticate, downloadTrack);
  app.get("/api/offline/download/:trackId/progress", authenticate, getDownloadProgress);
  app.get("/api/offline/downloads", authenticate, getUserDownloads);
  app.get("/api/offline/serve/:trackId", authenticate, serveOfflineTrack);
  app.get("/api/offline/status/:trackId", authenticate, checkOfflineStatus);
  app.delete("/api/offline/:trackId", authenticate, deleteOfflineTrack);
  app.get("/api/offline/stats", authenticate, getOfflineStats);
  app.post("/api/offline/cleanup", authenticate, cleanupOfflineStorage);
  app.get("/api/offline/tracks", authenticate, getOfflineTracks);
  app.post("/api/offline/batch-download", authenticate, batchDownload);
  app.get("/api/offline/metadata/:trackId", authenticate, getOfflineTrackMetadata);

  return app;
}
