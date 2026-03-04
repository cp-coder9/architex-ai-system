import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useInvoiceStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Invoice } from '@/types';
import {
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Printer,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// Invoice Detail Dialog
function InvoiceDetailDialog({ invoice, isOpen, onClose }: { invoice: Invoice; isOpen: boolean; onClose: () => void }) {
  const markInvoiceAsPaid = useInvoiceStore(state => state.markInvoiceAsPaid);
  const [isPayConfirmOpen, setIsPayConfirmOpen] = useState(false);

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .invoice-title { font-size: 24px; font-weight: bold; }
            .meta { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
            th { background-color: #f9f9f9; }
            .totals { margin-top: 30px; text-align: right; }
            .total-row { font-size: 18px; font-weight: bold; color: #000; }
            .notes { margin-top: 40px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="invoice-title">INVOICE</div>
              <div>${invoice.invoiceNumber}</div>
            </div>
            <div style="text-align: right">
              <div style="font-weight: bold">Status: ${invoice.status.toUpperCase()}</div>
              <div>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div class="meta">
            <strong>Bill To:</strong><br>
            Client ID: ${invoice.clientId}<br>
            Project ID: ${invoice.projectId}
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Hours</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Professional Services</td>
                <td>${invoice.hoursTotal}</td>
                <td>R ${invoice.hourlyRate.toLocaleString()}</td>
                <td>R ${invoice.subtotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div>Subtotal: R ${invoice.subtotal.toLocaleString()}</div>
            <div>Tax (${(invoice.taxRate * 100).toFixed(0)}%): R ${invoice.taxAmount.toLocaleString()}</div>
            <div class="total-row">Total: R ${invoice.total.toLocaleString()}</div>
          </div>

          ${invoice.notes ? `<div class="notes"><strong>Notes:</strong><br>${invoice.notes}</div>` : ''}
          
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePayNow = async () => {
    try {
      await markInvoiceAsPaid(invoice.id);
      toast.success(`Invoice ${invoice.invoiceNumber} marked as paid`);
      onClose();
    } catch (error) {
      toast.error('Failed to process payment');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice {invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>Invoice details and breakdown</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={
                invoice.status === 'paid' ? 'bg-green-500' :
                  invoice.status === 'sent' ? 'bg-blue-500' :
                    invoice.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
              }>
                {invoice.status}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">R {invoice.total.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-lg font-semibold">R {invoice.subtotal.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Tax ({(invoice.taxRate * 100).toFixed(0)}%)</p>
              <p className="text-lg font-semibold">R {invoice.taxAmount.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Hours</p>
              <p className="text-lg font-semibold">{invoice.hoursTotal}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Hourly Rate</p>
              <p className="text-lg font-semibold">R {invoice.hourlyRate}</p>
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Due Date</p>
            <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>

          {invoice.notes && (
            <div>
              <p className="font-medium mb-2">Notes</p>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleDownloadPDF}>
              <Printer className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            {invoice.status === 'sent' && (
              <AlertDialog open={isPayConfirmOpen} onOpenChange={setIsPayConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button className="flex-1">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay Now
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to mark invoice <strong>{invoice.invoiceNumber}</strong> for <strong>R {invoice.total.toLocaleString()}</strong> as paid? This action will update the invoice status immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePayNow}>Confirm Payment</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Pending Invoice Row
function PendingInvoiceRow({
  invoice,
  index,
  onClick
}: {
  invoice: Invoice;
  index: number;
  onClick: () => void
}) {
  const markInvoiceAsPaid = useInvoiceStore(state => state.markInvoiceAsPaid);
  const [isPayConfirmOpen, setIsPayConfirmOpen] = useState(false);

  const handlePay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markInvoiceAsPaid(invoice.id);
      toast.success(`Invoice ${invoice.invoiceNumber} marked as paid`);
    } catch (error) {
      toast.error('Failed to process payment');
    }
  };

  return (
    <motion.div
      key={invoice.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-blue-500">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-medium">{invoice.invoiceNumber}</p>
          <p className="text-sm text-muted-foreground">
            Due: {new Date(invoice.dueDate).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right flex items-center gap-4">
        <div>
          <p className="font-bold">R {invoice.total.toLocaleString()}</p>
        </div>
        <AlertDialog open={isPayConfirmOpen} onOpenChange={setIsPayConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsPayConfirmOpen(true);
              }}
            >
              Pay Now
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
              <AlertDialogDescription>
                Confirm payment of <strong>R {invoice.total.toLocaleString()}</strong> for invoice <strong>{invoice.invoiceNumber}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePay}>Confirm Payment</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

export function MyInvoices() {
  const { currentUser } = useAuthStore();
  const allInvoices = useInvoiceStore(state => state.invoices);

  const invoices = useMemo(() =>
    allInvoices.filter(inv => inv.clientId === currentUser?.id),
    [allInvoices, currentUser?.id]
  );
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Calculate stats
  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPending = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalOverdue = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle2;
      case 'sent': return Clock;
      case 'overdue': return AlertCircle;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'sent': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">My Invoices</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your invoices and payments.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">R{totalPaid.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-blue-600">R{totalPending.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-3xl font-bold text-red-600">R{totalOverdue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>Complete invoice history</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {invoices.slice().reverse().map((invoice, index) => {
                    const StatusIcon = getStatusIcon(invoice.status);
                    return (
                      <motion.div
                        key={invoice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsDetailOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${getStatusColor(invoice.status)}`}>
                            <StatusIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(invoice.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">R{invoice.total.toLocaleString()}</p>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invoices</CardTitle>
              <CardDescription>Invoices awaiting payment</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {invoices
                    .filter(inv => inv.status === 'sent')
                    .map((invoice, index) => (
                      <PendingInvoiceRow
                        key={invoice.id}
                        invoice={invoice}
                        index={index}
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsDetailOpen(true);
                        }}
                      />
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardHeader>
              <CardTitle>Paid Invoices</CardTitle>
              <CardDescription>Payment history</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {invoices
                    .filter(inv => inv.status === 'paid')
                    .map((invoice, index) => (
                      <motion.div
                        key={invoice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsDetailOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-green-500">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              Paid: {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '-'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">R{invoice.total.toLocaleString()}</p>
                          <Badge>Paid</Badge>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <InvoiceDetailDialog
          invoice={selectedInvoice}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
}
