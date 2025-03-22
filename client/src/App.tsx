import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Watchlist from "@/pages/Watchlist";
import Predictions from "@/pages/Predictions";
import AIInsights from "@/pages/AIInsights";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { AuthProvider } from "./lib/auth.tsx";
import { ThemeProvider } from "./lib/themeContext";
import { Layout } from "@/components/Layout";

// New pages based on the UI/UX specifications
import SuhuAI from "@/pages/SuhuAI";
import Algotrade from "@/pages/Algotrade";

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/register">
        <Register />
      </Route>
      
      <Route path="/">
        <Layout>
          <Home />
        </Layout>
      </Route>
      <Route path="/watchlist">
        <Layout title="Watchlist">
          <Watchlist />
        </Layout>
      </Route>
      <Route path="/predictions">
        <Layout title="Predictions">
          <Predictions />
        </Layout>
      </Route>
      <Route path="/ai-insights">
        <Layout title="AI Insights">
          <AIInsights />
        </Layout>
      </Route>
      <Route path="/algotrade">
        <Layout title="Algotrade">
          <Algotrade />
        </Layout>
      </Route>
      <Route path="/settings">
        <Layout title="Settings" showBackButton>
          <Settings />
        </Layout>
      </Route>
      <Route path="/suhu-ai">
        <Layout title="SuhuAI Assistant" showBackButton>
          <SuhuAI />
        </Layout>
      </Route>
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
