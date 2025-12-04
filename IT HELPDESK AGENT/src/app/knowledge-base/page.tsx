import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { UploadCloud, Search } from "lucide-react"

export default function KnowledgeBasePage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b bg-background px-6 py-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Knowledge Base
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage knowledge base documents and AI assistant configuration.
              </p>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-6">
            <Tabs defaultValue="knowledge-base" className="flex flex-1 flex-col gap-6">
              <TabsList className="w-fit">
                <TabsTrigger value="knowledge-base">
                  Knowledge Base
                </TabsTrigger>
                <TabsTrigger value="improve-with-ai">
                  Improve with AI
                </TabsTrigger>
                <TabsTrigger value="ai-configuration">
                  AI Configuration
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="knowledge-base"
                className="flex flex-col gap-6"
              >
                <Card className="border-dashed py-10 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#603BFC]/10 to-[#A94FA1]/10">
                      <UploadCloud className="h-6 w-6 text-[#603BFC]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Upload Documents
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Drag and drop files here, or click to browse.
                        Supported format: PDF (max 10MB per file).
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button size="sm" variant="default">
                        Browse files
                      </Button>
                      <Button size="sm" variant="outline">
                        Learn more
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Future scope
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Fetch knowledge from existing platforms (Confluence, Notion, SharePoint).</li>
                    <li>Auto-sync with company databases and HR / IT systems.</li>
                    <li>Integrate with cloud storage providers like Google Drive and OneDrive.</li>
                  </ul>
                </div>

                <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      className="pl-9 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>Showing 0 documents</span>
                  </div>
                </div>

                <Card className="flex h-32 items-center justify-center border-dashed text-sm text-muted-foreground">
                  Document list will appear here once documents are added.
                </Card>
              </TabsContent>

              <TabsContent value="improve-with-ai">
                <Card className="flex flex-col gap-3 p-6 text-sm">
                  <h2 className="text-base font-semibold">
                    Improve with AI
                  </h2>
                  <p className="text-muted-foreground">
                    Configure how the AI assistant should learn from and refine your existing
                    knowledge base. This section can be wired to Lyzr APIs or your own
                    embedding pipeline.
                  </p>
                </Card>
              </TabsContent>

              <TabsContent value="ai-configuration">
                <Card className="flex flex-col gap-3 p-6 text-sm">
                  <h2 className="text-base font-semibold">
                    AI Configuration
                  </h2>
                  <p className="text-muted-foreground">
                    Define guardrails, tone, and data access policies for the IT Helpdesk
                    assistant. Use this area to align responses with your organization&apos;s
                    security and compliance standards.
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


