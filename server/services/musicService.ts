import spotifyService from './spotifyService';

/**
 * Music Service - Spotify only
 * 
 * This service uses Spotify for all music data and authentication
 */
class MusicService {
  // User management - Keep Spotify for authentication
  async generateAuthUrl(state?: string): Promise<string> {
    return spotifyService.generateAuthUrl(state);
  }

  async exchangeCodeForToken(code: string) {
    return spotifyService.exchangeCodeForToken(code);
  }

  async refreshToken(refreshToken: string) {
    return spotifyService.refreshToken(refreshToken);
  }

  // Music data - Use Spotify
  async search(
    query: string,
    type: string = 'track,album,artist,playlist',
    limit: number = 20,
    offset: number = 0
  ) {
    // Use Spotify for search
    const accessToken = await spotifyService.getClientCredentialsToken();
    return spotifyService.search(query, type, accessToken.access_token, limit, offset);
  }

  async getTrack(trackId: string) {
    // Get track from Spotify
    const accessToken = await spotifyService.getClientCredentialsToken();
    return spotifyService.getTrack(trackId, accessToken.access_token);
  }

  async getFeaturedPlaylists(limit: number = 20, offset: number = 0, country?: string) {
    // Get featured playlists from Spotify
    const accessToken = await spotifyService.getClientCredentialsToken();
    return spotifyService.getFeaturedPlaylists(accessToken.access_token, limit, offset, country);
  }

  async getRecommendations(
    seedArtists?: string[],
    seedGenres?: string[],
    seedTracks?: string[],
    limit: number = 20
  ) {
    // Use Spotify for recommendations
    const accessToken = await spotifyService.getClientCredentialsToken();
    return spotifyService.getRecommendations(
      accessToken.access_token,
      seedArtists,
      seedGenres,
      seedTracks,
      limit
    );
  }

  async getNewReleases(limit: number = 20, offset: number = 0, country?: string) {
    // Get new releases from Spotify
    const accessToken = await spotifyService.getClientCredentialsToken();
    return spotifyService.getNewReleases(accessToken.access_token, limit, offset, country);
  }

  // Additional Spotify methods
  async getAlbum(albumId: string) {
    const accessToken = await spotifyService.getClientCredentialsToken();
    return spotifyService.getAlbum(albumId, accessToken.access_token);
  }

  async getAlbumTracks(albumId: string, limit: number = 20, offset: number = 0) {
    const accessToken = await spotifyService.getClientCredentialsToken();
    return spotifyService.getAlbumTracks(albumId, accessToken.access_token, limit, offset);
  }

  async getArtist(artistId: string) {
    const accessToken = await spotifyService.getClientCredentialsToken();
    return spotifyService.getArtist(artistId, accessToken.access_token);
  }

  async getArtistTopTracks(artistId: string, market: string = 'US') {
    const accessToken = await spotifyService.getClientCredentialsToken();
    return spotifyService.getArtistTopTracks(artistId, accessToken.access_token, market);
  }

  async getArtistAlbums(artistId: string, limit: number = 20, offset: number = 0) {
    const accessToken = await spotifyService.getClientCredentialsToken();
    return spotifyService.getArtistAlbums(artistId, accessToken.access_token, limit, offset);
  }

  async getRelatedArtists(artistId: string) {
    const accessToken = await spotifyService.getClientCredentialsToken();
    return spotifyService.getRelatedArtists(artistId, accessToken.access_token);
  }

  async getPlaylist(playlistId: string, accessToken: string) {
    return spotifyService.getPlaylist(playlistId, accessToken);
  }

  async getPlaylistTracks(playlistId: string, accessToken: string, limit: number = 20, offset: number = 0) {
    return spotifyService.getPlaylistTracks(playlistId, accessToken, limit, offset);
  }

  async getUserPlaylists(accessToken: string, limit: number = 20, offset: number = 0) {
    return spotifyService.getUserPlaylists(accessToken, limit, offset);
  }

  async getSavedTracks(accessToken: string, limit: number = 20, offset: number = 0) {
    return spotifyService.getSavedTracks(accessToken, limit, offset);
  }

  async getSavedAlbums(accessToken: string, limit: number = 20, offset: number = 0) {
    return spotifyService.getSavedAlbums(accessToken, limit, offset);
  }

  async getFollowedArtists(accessToken: string, limit: number = 20, after?: string) {
    return spotifyService.getFollowedArtists(accessToken, limit, after);
  }

  async getTopItems(accessToken: string, type: 'artists' | 'tracks', limit: number = 20, offset: number = 0, timeRange: string = 'medium_term') {
    return spotifyService.getTopItems(accessToken, type, limit, offset, timeRange);
  }

  async getRecentlyPlayed(accessToken: string, limit: number = 20, after?: number, before?: number) {
    return spotifyService.getRecentlyPlayed(accessToken, limit, after, before);
  }

  async getCategories(accessToken: string, limit: number = 20, offset: number = 0, country?: string) {
    return spotifyService.getCategories(accessToken, limit, offset, country);
  }

  async getCategoryPlaylists(categoryId: string, accessToken: string, limit: number = 20, offset: number = 0, country?: string) {
    return spotifyService.getCategoryPlaylists(categoryId, accessToken, limit, offset, country);
  }

  async getGenreSeeds(accessToken: string) {
    return spotifyService.getGenreSeeds(accessToken);
  }

  async checkSavedTracks(trackIds: string[], accessToken: string) {
    return spotifyService.checkSavedTracks(trackIds, accessToken);
  }

  async saveTracks(trackIds: string[], accessToken: string) {
    return spotifyService.saveTracks(trackIds, accessToken);
  }

  async removeSavedTracks(trackIds: string[], accessToken: string) {
    return spotifyService.removeSavedTracks(trackIds, accessToken);
  }
}

export default new MusicService();