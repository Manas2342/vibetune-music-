import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { MusicPlayer } from "@/components/MusicPlayer";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MusicPlayerProvider } from "@/contexts/EnhancedMusicPlayerContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Library from "./pages/Library";
import Playlist from "./pages/Playlist";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import CameraTest from "./pages/CameraTest";
import SpotifyCallback from "./pages/SpotifyCallback";
import LikedSongs from "./pages/LikedSongs";
import CreatePlaylist from "./pages/CreatePlaylist";
import Artist from "./pages/Artist";
import Downloaded from "./pages/Downloaded";

const WebcamDemo = lazy(() => import("./pages/WebcamDemo"));
const FaceRecognitionProfiles = lazy(() => import("./pages/FaceRecognitionProfiles"));
const Discover = lazy(() => import("./pages/Discover"));
const Social = lazy(() => import("./pages/Social"));
const Trending = lazy(() => import("./pages/Trending"));
const ArtistDiscovery = lazy(() => import("./pages/ArtistDiscovery"));

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="h-screen bg-vibetune-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-vibetune-green border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-vibetune-dark text-white overflow-hidden">
      <div className="flex h-full">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto pb-24">
            <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
          </main>
        </div>
      </div>
      <MusicPlayer />
    </div>
  );
}

function MainApp() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/callback" element={<SpotifyCallback />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/trending"
        element={
          <Layout>
            <Trending />
          </Layout>
        }
      />
      <Route
        path="/artists"
        element={
          <Layout>
            <ArtistDiscovery />
          </Layout>
        }
      />
      <Route
        path="/"
        element={
          <Layout>
            <Index />
          </Layout>
        }
      />
      <Route
        path="/search"
        element={
          <Layout>
            <Search />
          </Layout>
        }
      />
      <Route
        path="/library"
        element={
          <Layout>
            <Library />
          </Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <Layout>
            <Profile />
          </Layout>
        }
      />
      <Route
        path="/webcam"
        element={
          <Layout>
            <WebcamDemo />
          </Layout>
        }
      />
      <Route
        path="/camera-test"
        element={
          <Layout>
            <CameraTest />
          </Layout>
        }
      />
      <Route
        path="/face-profiles"
        element={
          <Layout>
            <FaceRecognitionProfiles />
          </Layout>
        }
      />
      <Route
        path="/playlist/:id"
        element={
          <Layout>
            <Playlist />
          </Layout>
        }
      />
      <Route
        path="/artist/:id"
        element={
          <Layout>
            <Artist />
          </Layout>
        }
      />
      <Route
        path="/create-playlist"
        element={
          <Layout>
            <CreatePlaylist />
          </Layout>
        }
      />
      <Route
        path="/liked"
        element={
          <Layout>
            <LikedSongs />
          </Layout>
        }
      />
      <Route
        path="/downloaded"
        element={
          <Layout>
            <Downloaded />
          </Layout>
        }
      />
      <Route
        path="/discover"
        element={
          <Layout>
            <Discover />
          </Layout>
        }
      />
      <Route path="/analytics" element={<Navigate to="/discover" replace />} />
      <Route
        path="/social"
        element={
          <Layout>
            <Social />
          </Layout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LibraryProvider>
            <MusicPlayerProvider>
              <MainApp />
            </MusicPlayerProvider>
          </LibraryProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
