import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useColorMode } from "@/hooks/useColorMode";
import { useToast } from "@/hooks/use-toast";
import { MoonIcon, SunIcon } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        setLocation("/");
      } else {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Nom d'utilisateur ou mot de passe incorrect",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Une erreur est survenue lors de la connexion",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleColorMode}
          aria-label={colorMode === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
        >
          {colorMode === 'dark' ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <h1 className="text-3xl font-heading font-bold text-primary">StaffSync</h1>
          </div>
          <CardTitle className="text-2xl font-semibold text-center">Connexion</CardTitle>
          <CardDescription className="text-center">
            Entrez vos identifiants pour accéder à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <a href="#" className="text-sm text-primary underline-offset-4 hover:underline">
                    Mot de passe oublié?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground w-full">
            Utilisez <strong>admin/password</strong> pour vous connecter en tant que gestionnaire 
            <br/>ou <strong>sophie/password</strong> en tant qu'employé
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
