import {
  ChevronDown,
  FolderKanban,
  HardHat,
  Users,
  IndianRupee,
  Receipt,
  FileCheck2,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import IncomeExpenseChart from "@/components/dashboard/income-expense-chart";
import {
  getDashboardStats,
  getExpenseBreakdown,
  getRecentInvoices,
  getQuotationPipeline,
  getLatestScrapEntries,
  getRecentInwardPayments,
  getSalesOverview,
  getMonthlyExpenseChart,
  getTopClients,
} from "@/app/actions/dashboard";
import FinanceSummary from "@/components/dashboard/finance-summary";
import QuickCreate from "@/components/dashboard/quick-create";
import TopExpenses from "@/components/dashboard/top-expenses";
import RecentInvoices from "@/components/dashboard/recent-invoices";
import QuotationPipeline from "@/components/dashboard/quotation-pipeline";
import ScrapActivity from "@/components/dashboard/scrap-activity";
import RecentPayments from "@/components/dashboard/recent-payments";
import SalesOverview from "@/components/dashboard/sales-overview";
import TopClients from "@/components/dashboard/top-clients";
import InvoiceCards from "@/components/dashboard/invoice-cards";

export default async function DashboardPage() {
  const {
    activeProjects,
    workersToday,
    totalReceivables,
    totalPayables,
    overdueInvoicesAmount,
    overdueBillsAmount,
    overdueInvoicesCount,
    unpaidInvoicesCount,
    totalIncome,
    totalExpenses,
  } = await getDashboardStats();

  const [
    expenseBreakdown,
    recentInvoicesRaw,
    quotationPipelineRaw,
    latestScrap,
    recentPayments,
    salesOverview,
    monthlyChartData,
    topClients,
  ] = await Promise.all([
    getExpenseBreakdown(),
    getRecentInvoices(),
    getQuotationPipeline(),
    getLatestScrapEntries(),
    getRecentInwardPayments(),
    getSalesOverview(),
    getMonthlyExpenseChart(),
    getTopClients(),
  ]);

  // Map data to component expected types with pre-formatted strings for hydration safety
  const invoices = recentInvoicesRaw.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber || "",
    clientName: inv.client,
    totalAmount: inv.total,
    status: inv.status || "pending",
    dateDisplay: inv.date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
  }));

  const payments = recentPayments.map((p) => ({
    ...p,
    dateDisplay: new Date(p.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
  }));

  const quotationPipeline = quotationPipelineRaw.map((p) => ({
    status: p.status || "draft",
    count: p.count,
    value: p.total,
  }));

  const scrapEntries = latestScrap.map((entry) => ({
    ...entry,
    dateDisplay: new Date(entry.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
  }));

  return (
    <div className="min-h-screen bg-[#F9FAFB]  py-2 mb-0">
      {/* Zoho Style Page Header */}

      <div className="md:hidden mb-6 md:mb-0 grid grid-cols-3 gap-4">
        <div className=" block md:hidden col-span-2">
          <FinanceSummary
            receivables={totalReceivables}
            totalIncome={totalIncome}
            overdueInvoicesAmount={overdueInvoicesAmount}
            overdueInvoicesCount={overdueInvoicesCount}
            unpaidInvoicesCount={unpaidInvoicesCount}
          />
        </div>
        <InvoiceCards
          overdueInvoicesCount={overdueInvoicesCount}
          unpaidInvoicesCount={unpaidInvoicesCount}
        />
      </div>

      <div className="space-y-2 md:space-y-6 max-w-[1400px] mx-auto">
        <QuickCreate />

        {/* ROW 1: Finance Summary & Pulse */}
        <div className=" hidden md:grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          <div className=" col-span-2 xl:col-span-2">
            <FinanceSummary
              receivables={totalReceivables}
              totalIncome={totalIncome}
              overdueInvoicesAmount={overdueInvoicesAmount}
              overdueInvoicesCount={overdueInvoicesCount}
              unpaidInvoicesCount={unpaidInvoicesCount}
            />
          </div>
          <InvoiceCards
            overdueInvoicesCount={overdueInvoicesCount}
            unpaidInvoicesCount={unpaidInvoicesCount}
          />
          {/* Flat Operational Pulse Card */}
          <div className="bg-white rounded-lg border border-slate-200 px-7 py-6 md:p-6 flex flex-col justify-between group hover:border-slate-300 transition-colors">
            <div>
              <h3 className="text-[10px] md:text-[12px] font-medium text-muted-foreground self-start tracking-widest mb-6 uppercase">
                Site Activity
              </h3>
              <div className="space-y-2 md:space-y-6">
                <div className="flex items-center gap-4 justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                    <FolderKanban
                      size={18}
                      className="text-muted-foreground/60 group-hover:text-primary transition-colors"
                      strokeWidth={2}
                    />
                    <span className="text-[12px] md:text-[13px] font-normal tracking-tight">
                      Active Projects
                    </span>
                  </div>
                  <span className="text-base md:text-xl font-medium text-foreground">
                    {activeProjects}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-muted-foreground group-hover:text-foreground transition-colors">
                    <Users
                      size={18}
                      className="text-muted-foreground/60 group-hover:text-primary transition-colors"
                      strokeWidth={2}
                    />
                    <span className="text-[12px] md:text-[13px] font-normal tracking-tight">
                      Workforce
                    </span>
                  </div>
                  <span className="text-base md:text-xl font-medium text-foreground">
                    {workersToday}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/projects"
              className="mt-8 py-2 bg-slate-50 hover:bg-slate-100 rounded text-[12px] font-semibold text-muted-foreground text-center transition-colors border border-slate-200 flex items-center justify-center gap-4"
            >
              View All Projects
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="md:hidden bg-white rounded-lg border border-slate-200 px-7 py-6 md:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-medium text-foreground self-start tracking-tight mb-6">
              Site Activity
            </h3>
            <div className="space-y-2 md:space-y-6">
              <div className="flex items-center gap-4 justify-between">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <FolderKanban
                    size={18}
                    className="text-muted-foreground/60"
                    strokeWidth={2}
                  />
                  <span className="text-[14px] font-normal">
                    Active Projects
                  </span>
                </div>
                <span className="text-base md:text-xl font-medium text-foreground">
                  {activeProjects}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <Users
                    size={18}
                    className="text-muted-foreground/60"
                    strokeWidth={2}
                  />
                  <span className="text-[14px] font-normal">
                    Workforce
                  </span>
                </div>
                <span className="text-base md:text-xl font-medium text-foreground">
                  {workersToday}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/projects"
            className="mt-8 py-2 bg-slate-50 hover:bg-slate-100 rounded text-[12px] font-semibold text-muted-foreground text-center transition-colors border border-slate-200 flex items-center justify-center gap-4"
          >
            View All Projects
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* ROW 2: Sales Insights (Template Based Performance) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 md:gap-6 gap-4">
          <SalesOverview data={salesOverview} />
          <RecentPayments payments={payments} />
        </div>

        <div className="md:hidden grid grid-cols-1 gap-4">
          <QuotationPipeline data={quotationPipeline} />
          <ScrapActivity entries={scrapEntries} />
        </div>
        {/* ROW 4: Detailed Transactions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 md:gap-6 gap-4">
          <div className="xl:col-span-2">
            <RecentInvoices invoices={invoices} />
          </div>
          <TopClients clients={topClients} />
        </div>

        {/* ROW 5: Low Energy Flows (Static-ish) */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuotationPipeline data={quotationPipeline} />
          <ScrapActivity entries={scrapEntries} />
        </div>

        {/* ROW 3: Financial Deep-Dive (Dynamic Income/Expense) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 md:gap-6 gap-4">
          <IncomeExpenseChart
            data={monthlyChartData}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
          />

          <TopExpenses data={expenseBreakdown} />
        </div>
      </div>
    </div>
  );
}
