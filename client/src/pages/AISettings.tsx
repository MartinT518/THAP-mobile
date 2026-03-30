import { MobileLayout } from "@/components/MobileLayout";
import { AppBar } from "@/components/AppBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const AI_PROVIDERS = [
  { id: "openai", name: "ChatGPT", description: "OpenAI GPT-4", icon: "🤖" },
  { id: "gemini", name: "Gemini", description: "Google Gemini Pro", icon: "✨" },
  { id: "perplexity", name: "Perplexity", description: "Perplexity AI", icon: "🔍" },
  { id: "deepseek", name: "DeepSeek", description: "DeepSeek AI", icon: "🧠" },
] as const;

type ProviderId = typeof AI_PROVIDERS[number]["id"];

export default function AISettings() {
  const { t } = useTranslation();
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  const { data: providers, refetch } = trpc.ai.getProviders.useQuery();
  const { data: activeProvider } = trpc.ai.getActiveProvider.useQuery();
  const saveProviderMutation = trpc.ai.saveProvider.useMutation();

  const handleProviderSelect = (providerId: ProviderId) => {
    setSelectedProvider(providerId);
    setApiKey("");
    setValidated(false);
  };

  const handleValidateAndSave = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      toast.error(t("aiSettings.enterApiKey"));
      return;
    }

    setValidating(true);

    try {
      // Note: In a real implementation, we would validate the API key
      // For demo purposes, we'll use the built-in LLM which doesn't need validation
      
      // Save the provider settings
      await saveProviderMutation.mutateAsync({
        provider: selectedProvider,
        apiKey: apiKey.trim(),
        isActive: true,
      });

      setValidated(true);
      toast.success(t("aiSettings.ready"));
      await refetch();
      
      // Reset after 2 seconds
      setTimeout(() => {
        setSelectedProvider(null);
        setApiKey("");
        setValidated(false);
      }, 2000);
    } catch (error) {
      toast.error(t("aiSettings.validateFailed"));
      console.error(error);
    } finally {
      setValidating(false);
    }
  };

  return (
    <MobileLayout showBottomNav={false}>
      <AppBar title={t("aiSettings.title")} onBack={() => window.history.back()} />
      
      <div className="container py-6 space-y-6">
        {/* Header */}
        <Card className="p-6 elevation-1 bg-primary/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="title-large mb-2">{t("aiSettings.heroTitle")}</h2>
              <p className="body-medium text-muted-foreground">
                {t("aiSettings.heroDescription")}
              </p>
            </div>
          </div>
        </Card>

        {/* Active Provider Display */}
        {activeProvider && !selectedProvider && (
          <Card className="p-4 elevation-1 bg-accent/10 border-accent">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-accent" />
              <div>
                <p className="body-large font-medium">{t("aiSettings.assistantReady")}</p>
                <p className="body-small text-muted-foreground">
                  {t("aiSettings.isActive", { name: AI_PROVIDERS.find(p => p.id === activeProvider.provider)?.name })}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Provider List */}
        <div>
          <h3 className="label-large text-muted-foreground px-2 mb-3">
            {t("aiSettings.availableModels")}
          </h3>
          <Card className="elevation-1 divide-y divide-border">
            {AI_PROVIDERS.map((provider) => {
              const isInstalled = providers?.some(p => p.provider === provider.id);
              const isActive = activeProvider?.provider === provider.id;
              const isSelected = selectedProvider === provider.id;

              return (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider.id)}
                  className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="text-3xl">{provider.icon}</div>
                  <div className="flex-1">
                    <p className="body-large font-medium">{provider.name}</p>
                    <p className="body-small text-muted-foreground">{provider.description}</p>
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1 text-accent">
                      <CheckCircle className="w-4 h-4" />
                      <span className="label-small">{t("aiSettings.active")}</span>
                    </div>
                  )}
                  {isInstalled && !isActive && (
                    <span className="label-small text-muted-foreground">{t("aiSettings.installed")}</span>
                  )}
                </button>
              );
            })}
          </Card>
        </div>

        {/* API Key Input */}
        {selectedProvider && !validated && (
          <Card className="p-6 elevation-1">
            <div className="space-y-4">
              <div>
                <h3 className="title-medium mb-2">
                  {t("aiSettings.configure", { name: AI_PROVIDERS.find(p => p.id === selectedProvider)?.name })}
                </h3>
                <p className="body-small text-muted-foreground">
                  {t("aiSettings.configureSubtitle")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">{t("aiSettings.apiKey")}</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono"
                />
                <p className="body-small text-muted-foreground">
                  {t("aiSettings.apiKeyHelp")}
                </p>
              </div>

              <Button
                onClick={handleValidateAndSave}
                disabled={validating || !apiKey.trim()}
                className="w-full rounded-full"
                size="lg"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t("aiSettings.validating")}
                  </>
                ) : (
                  t("aiSettings.confirm")
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Success State */}
        {validated && (
          <Card className="p-8 elevation-1 bg-accent/10 border-accent">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="w-16 h-16 text-accent mb-4" />
              <h3 className="title-large text-accent mb-2">{t("aiSettings.successTitle")}</h3>
              <p className="body-medium text-muted-foreground">
                {t("aiSettings.successDescription")}
              </p>
            </div>
          </Card>
        )}

        {/* Help Text */}
        <Card className="p-6 elevation-1">
          <h3 className="title-medium mb-3">{t("aiSettings.helpTitle")}</h3>
          <ul className="space-y-3 body-medium text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span dangerouslySetInnerHTML={{ __html: t("aiSettings.helpChatGPT") }} />
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span dangerouslySetInnerHTML={{ __html: t("aiSettings.helpGemini") }} />
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span dangerouslySetInnerHTML={{ __html: t("aiSettings.helpOthers") }} />
            </li>
          </ul>
        </Card>
      </div>
    </MobileLayout>
  );
}
