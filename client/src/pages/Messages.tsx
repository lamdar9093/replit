import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SendHorizontal, CheckCheck, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  // Fetch messages
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/messages', { userId: user?.id }],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/messages?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!user
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedUser || !messageText.trim()) {
        throw new Error("Cannot send empty message");
      }
      return apiRequest("POST", "/api/messages", {
        senderId: user.id,
        receiverId: selectedUser.id,
        content: messageText
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', { userId: user?.id }] });
      setMessageText("");
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de l'envoi du message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter users for chat list
  const filteredUsers = users?.filter((u: any) => {
    if (u.id === user?.id) return false; // Don't show current user
    if (!searchQuery) return true;
    
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Filter messages for selected conversation
  const conversationMessages = messages?.filter((msg: any) => {
    if (!selectedUser) return false;
    return (msg.senderId === user?.id && msg.receiverId === selectedUser.id) || 
           (msg.senderId === selectedUser.id && msg.receiverId === user?.id);
  }).sort((a: any, b: any) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Get last message for each user
  const getLastMessage = (userId: number) => {
    if (!messages) return null;
    
    const relevantMessages = messages.filter((msg: any) => {
      return (msg.senderId === user?.id && msg.receiverId === userId) || 
             (msg.senderId === userId && msg.receiverId === user?.id);
    });
    
    if (relevantMessages.length === 0) return null;
    
    // Sort by date and get the latest
    return relevantMessages.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })[0];
  };

  // Get unread message count for a user
  const getUnreadCount = (userId: number) => {
    if (!messages) return 0;
    
    return messages.filter((msg: any) => {
      return msg.senderId === userId && msg.receiverId === user?.id && !msg.isRead;
    }).length;
  };

  // Set up interval to refresh messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        refetchMessages();
      }
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [user, refetchMessages]);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Messagerie</h1>
          <p className="text-muted-foreground">Communiquez avec vos collègues</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chat list */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un employé" 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(80vh-13rem)]">
              {filteredUsers?.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredUsers.map((chatUser: any) => {
                    const lastMessage = getLastMessage(chatUser.id);
                    const unreadCount = getUnreadCount(chatUser.id);
                    
                    return (
                      <div 
                        key={chatUser.id} 
                        className={`flex items-center p-4 hover:bg-muted cursor-pointer ${selectedUser?.id === chatUser.id ? 'bg-muted' : ''}`}
                        onClick={() => setSelectedUser(chatUser)}
                      >
                        <Avatar className="h-10 w-10 mr-4">
                          <AvatarImage src={chatUser.profileImage} alt={`${chatUser.firstName} ${chatUser.lastName}`} />
                          <AvatarFallback>{chatUser.firstName[0]}{chatUser.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between">
                            <h3 className="font-medium truncate">{chatUser.firstName} {chatUser.lastName}</h3>
                            {lastMessage && (
                              <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                                {format(new Date(lastMessage.createdAt), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          {lastMessage ? (
                            <p className="text-sm text-muted-foreground truncate">
                              {lastMessage.senderId === user?.id ? 'Vous: ' : ''}
                              {lastMessage.content}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Aucun message</p>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <div className="ml-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Aucun utilisateur trouvé
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Chat window */}
        <Card className="md:col-span-2">
          <CardHeader className="border-b">
            {selectedUser ? (
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarImage src={selectedUser.profileImage} alt={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                  <AvatarFallback>{selectedUser.firstName[0]}{selectedUser.lastName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedUser.firstName} {selectedUser.lastName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedUser.position}</p>
                </div>
              </div>
            ) : (
              <CardTitle>Sélectionnez une conversation</CardTitle>
            )}
          </CardHeader>
          <CardContent className="p-0 flex flex-col">
            {selectedUser ? (
              <>
                <ScrollArea className="flex-1 h-[calc(80vh-16rem)]">
                  {conversationMessages?.length > 0 ? (
                    <div className="p-4 space-y-4">
                      {conversationMessages.map((msg: any) => {
                        const isSender = msg.senderId === user?.id;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[75%] px-4 py-2 rounded-lg ${
                                isSender 
                                  ? 'bg-primary text-primary-foreground rounded-br-none' 
                                  : 'bg-muted rounded-bl-none'
                              }`}
                            >
                              <p>{msg.content}</p>
                              <div className="flex items-center justify-end mt-1">
                                <span className="text-xs opacity-70">
                                  {format(new Date(msg.createdAt), 'HH:mm')}
                                </span>
                                {isSender && (
                                  <CheckCheck className="ml-1 h-3 w-3 opacity-70" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Aucun message. Commencez la conversation!
                    </div>
                  )}
                </ScrollArea>
                <Separator />
                <div className="p-4 flex items-center">
                  <Input
                    placeholder="Tapez votre message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (messageText.trim()) {
                          sendMessageMutation.mutate();
                        }
                      }
                    }}
                    className="flex-1 mr-2"
                  />
                  <Button 
                    onClick={() => sendMessageMutation.mutate()}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="h-[calc(80vh-13rem)] flex items-center justify-center text-muted-foreground">
                Sélectionnez une conversation pour commencer à chatter
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
