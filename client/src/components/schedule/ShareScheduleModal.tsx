import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Mail, Share2, Check, Link as LinkIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShareScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: Date;
  endDate: Date;
  departmentFilter?: string;
}

export default function ShareScheduleModal({
  isOpen,
  onClose,
  startDate,
  endDate,
  departmentFilter = "all",
}: ShareScheduleModalProps) {
  const [emails, setEmails] = useState<string>("");
  const [message, setMessage] = useState<string>("Voici l'horaire de la semaine. Veuillez le consulter.");
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const { toast } = useToast();

  // Format date for display
  const formatDateRange = () => {
    const start = startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const end = endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${start} - ${end}`;
  };

  // Generate share link
  const getShareLink = () => {
    const params = new URLSearchParams();
    params.append('start', startDate.toISOString());
    params.append('end', endDate.toISOString());
    if (departmentFilter !== 'all') {
      params.append('department', departmentFilter);
    }
    params.append('shared', 'true');
    params.append('notes', includeNotes.toString());
    
    return `${window.location.origin}/schedule/share?${params.toString()}`;
  };

  // Copy link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(getShareLink()).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast({
        title: "Lien copié",
        description: "Le lien de partage a été copié dans le presse-papier.",
      });
    });
  };

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/schedule/share-email", data);
    },
    onSuccess: () => {
      toast({
        title: "Email envoyé",
        description: "L'horaire a été partagé par email.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de l'envoi: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle email share
  const handleEmailShare = () => {
    const emailList = emails.split(',').map(email => email.trim()).filter(Boolean);
    
    if (emailList.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer au moins une adresse email.",
        variant: "destructive",
      });
      return;
    }
    
    sendEmailMutation.mutate({
      emails: emailList,
      message,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      departmentFilter,
      includeNotes,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Partager l'horaire
          </DialogTitle>
          <DialogDescription>
            Partagez l'horaire du {formatDateRange()} avec votre équipe.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Lien de partage</TabsTrigger>
            <TabsTrigger value="email">Par email</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="py-4 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Input
                    value={getShareLink()}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={copyToClipboard}>
                    {copySuccess ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <Switch
                    id="includeNotes"
                    checked={includeNotes}
                    onCheckedChange={setIncludeNotes}
                  />
                  <Label htmlFor="includeNotes">Inclure les notes</Label>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Ce lien permet de visualiser l'horaire sans pouvoir le modifier. Idéal pour le partage avec les employés.
                </p>
              </CardContent>
            </Card>
            
            <div className="flex justify-center space-x-2">
              <Button variant="outline" className="w-full" onClick={onClose}>
                Annuler
              </Button>
              <Button className="w-full" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copier le lien
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="email" className="py-4 space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="emails" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Adresses email
                </Label>
                <Input
                  id="emails"
                  placeholder="email@exemple.com, email2@exemple.com"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Séparez plusieurs adresses par des virgules.
                </p>
              </div>
              
              <div>
                <Label htmlFor="message">Message (optionnel)</Label>
                <Textarea
                  id="message"
                  placeholder="Ajoutez un message personnalisé"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="h-24"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeNotesEmail"
                  checked={includeNotes}
                  onCheckedChange={setIncludeNotes}
                />
                <Label htmlFor="includeNotesEmail">
                  Inclure les notes des quarts de travail
                </Label>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                onClick={handleEmailShare}
                disabled={sendEmailMutation.isPending}
              >
                <Mail className="h-4 w-4 mr-2" />
                {sendEmailMutation.isPending ? "Envoi en cours..." : "Envoyer"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}