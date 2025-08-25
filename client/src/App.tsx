import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Session from "@/pages/session";
import JoinSession from "@/pages/join-session";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/session/:sessionId" component={Session} />
      <Route path="/s/:sessionId" component={Session} />
      <Route path="/join/:shareCode" component={JoinSession} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
