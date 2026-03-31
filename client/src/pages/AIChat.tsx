import { AppBar } from "@/components/AppBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, Sparkles, AlertCircle, ListRestart, MessageSquarePlus } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useTranslation } from "react-i18next";
import {
  selectRelevantQuestions,
  determineLifecycleStage,
  mapProductCategory,
  type AIQuestion,
} from "@shared/aiQuestions";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function AIChat() {
  const { t } = useTranslation();
  const [, params] = useRoute("/ai-chat/:productId");
  const [location] = useLocation();
  const productId = params?.productId ? parseInt(params.productId) : 0;

  const searchParams = new URLSearchParams(location.split("?")[1]);
  const isOwned = searchParams.get("owned") === "true";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: scanHistory } = trpc.scanHistory.list.useQuery();
  const { data: myProducts } = trpc.products.myProducts.useQuery();

  const { data: existingConversation, isLoading: isLoadingConversation } =
    trpc.ai.getConversationByProduct.useQuery(
      { productId },
      { enabled: productId > 0 },
    );

  useEffect(() => {
    if (existingConversation && !conversationId) {
      setConversationId(existingConversation.id);
      const restored = existingConversation.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
      if (restored.length > 0) {
        setMessages(restored);
      }
    }
  }, [existingConversation, conversationId]);

  let product = null;
  if (scanHistory) {
    const historyItem = scanHistory.find((h) => h.product?.id === productId);
    if (historyItem) product = historyItem.product;
  }
  if (myProducts && !product) {
    const ownedProduct = myProducts.find((p) => p.product?.id === productId);
    if (ownedProduct) product = ownedProduct.product;
  }

  const lifecycleStage = determineLifecycleStage(isOwned, false);
  const productCategory = mapProductCategory(product?.category);

  const relevantQuestions = selectRelevantQuestions(
    { lifecycleStage, productCategory, isOwned, hasVerifiedData: false },
    8,
  );

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      setShowSuggestions(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    },
    onError: (err) => {
      toast.error(err.message || t("aiChat.chatFailed"));
      setShowSuggestions(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            t("aiChat.errorMessage"),
        },
      ]);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePromptClick = (question: AIQuestion) => {
    setShowSuggestions(false);
    handleSendMessage(question.text);
  };

  const handleSendMessage = (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || chatMutation.isPending) return;

    setShowSuggestions(false);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: textToSend }]);

    chatMutation.mutate({
      message: textToSend,
      productId,
      conversationId,
    });
  };

  const handleNewChat = () => {
    setConversationId(undefined);
    setMessages([]);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const hasMessages = messages.length > 0;

  if (isLoadingConversation) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppBar title={t("aiChat.title")} onBack={() => window.history.back()} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppBar
        title={product ? t("aiChat.titleWithProduct", { name: product.name }) : t("aiChat.title")}
        onBack={() => window.history.back()}
        actions={hasMessages ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            title={t("aiChat.newChat")}
          >
            <MessageSquarePlus className="w-5 h-5" />
          </Button>
        ) : undefined}
      />

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="container py-6 space-y-4">
          {product && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    {product.brand || t("common.brand")}
                  </p>
                  <p className="font-semibold text-sm line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isOwned ? t("aiChat.ownedProduct") : t("aiChat.consideringPurchase")}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {!hasMessages && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                {t("aiChat.emptyTitle")}
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {t("aiChat.emptyDescription")}
              </p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {t("aiChat.suggestedQuestions")}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {relevantQuestions.map((question) => (
                    <button
                      key={question.id}
                      onClick={() => handlePromptClick(question)}
                      className="px-4 py-2 bg-white border border-border rounded-full text-sm text-left hover:bg-muted transition-colors"
                    >
                      {t(`aiQuestions.${question.id}`, { defaultValue: question.text })}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hasMessages && !showSuggestions && (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <Card
                    className={`max-w-[85%] p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Streamdown className="text-sm prose prose-sm max-w-none dark:prose-invert">
                        {message.content}
                      </Streamdown>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </Card>
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <Card className="p-4 bg-card">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </Card>
                </div>
              )}

              {chatMutation.isError && (
                <div className="flex justify-start">
                  <Card className="p-4 bg-destructive/10 border-destructive/30">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{t("aiChat.inlineError")}</span>
                    </div>
                  </Card>
                </div>
              )}

              {!chatMutation.isPending && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setShowSuggestions(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ListRestart className="w-4 h-4" />
                    {t("aiChat.showSuggestions")}
                  </button>
                </div>
              )}
            </>
          )}

          {hasMessages && showSuggestions && (
            <div className="text-center py-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                {t("aiChat.suggestedQuestions")}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {relevantQuestions.map((question) => (
                  <button
                    key={question.id}
                    onClick={() => handlePromptClick(question)}
                    className="px-4 py-2 bg-white border border-border rounded-full text-sm text-left hover:bg-muted transition-colors"
                  >
                    {t(`aiQuestions.${question.id}`, { defaultValue: question.text })}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="mt-4 text-sm text-primary hover:underline"
              >
                {t("aiChat.backToChat")}
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe">
        <div className="container py-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("aiChat.placeholder")}
              className="flex-1"
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || chatMutation.isPending}
              size="icon"
              className="flex-shrink-0"
            >
              {chatMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
