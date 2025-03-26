import { Button } from "@/components/ui/button";
import { useColorMode } from "@/hooks/useColorMode";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleColorMode}
      aria-label={colorMode === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
    >
      {colorMode === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
