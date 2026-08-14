/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import {
  Monitor,
  ShoppingBag,
  Grid,
  ChefHat,
  Truck,
  Wallet,
  AlertCircle,
  Plus,
  Search,
  Check,
  User,
  MapPin,
  Clock,
  Printer,
  Users,
  Utensils,
  Lock,
  RefreshCw
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../components/ui/DataDisplay';
import { Button } from '../components/ui/Button';
import { Drawer, Dialog } from '../components/ui/Overlay';
import { LoadingState, EmptyState } from '../components/ui/Feedback';
import { formatCentsToBRL } from '../utils/currency';
import { useRouter } from '../services/router';
import {
  Table,
  Order,
  OrderItem,
  Product,
  TableStatus,
  ProductionTicket,
  ProductionStationType,
  ProductionStatus
} from '../services/storage/types';
import {
  tablesRepository,
  ordersRepository,
  productsRepository,
  productionRepository,
  getOrRegisterDeviceId
} from '../services/storage';

// 1. PDV VIEW (PONTO DE VENDA)
export { PdvView } from './PdvView';

// 2. PEDIDOS VIEW (CENTRAL OPERACIONAL)
export { PedidosView } from './PedidosView';

// 3. MESAS VIEW
export function MesasView() {
  const [tables, setTables] = useState<Table[]>([]);
  const [ordersMap, setOrdersMap] = useState<Record<string, Order>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingTableId, setSubmittingTableId] = useState<string | null>(null);

  // Drawer / Modal states
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState<boolean>(false);

  // Add Item form states
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>('');
  const [isSubmittingItem, setIsSubmittingItem] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedTables, fetchedOrders, fetchedProducts] = await Promise.all([
        tablesRepository.getAll(),
        ordersRepository.getAll(),
        productsRepository.getAll()
      ]);

      // Map active orders to their table ID
      const activeMap: Record<string, Order> = {};
      for (const order of fetchedOrders) {
        if (order.tableId && order.status !== 'CANCELLED' && order.status !== 'COMPLETED') {
          activeMap[order.tableId] = order;
        }
      }

      setTables(fetchedTables);
      setOrdersMap(activeMap);
      setProducts(fetchedProducts.filter(p => p.active));

      // If drawer is open, keep selected order updated
      if (selectedTable) {
        const freshTable = fetchedTables.find(t => t.id === selectedTable.id) || null;
        setSelectedTable(freshTable);
        if (freshTable && freshTable.currentOrderId) {
          const freshOrder = fetchedOrders.find(o => o.id === freshTable.currentOrderId) || activeMap[freshTable.id] || null;
          setSelectedOrder(freshOrder);
        } else {
          setSelectedOrder(null);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar mesas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open a FREE table
  const handleOpenTable = async (table: Table) => {
    if (submittingTableId === table.id) return;

    try {
      setSubmittingTableId(table.id);

      // Verify current status in IndexedDB to ensure idempotency
      const freshTable = await tablesRepository.getById(table.id);
      if (!freshTable || freshTable.status !== 'FREE') {
        // Table is no longer FREE (already opened)
        await loadData();
        if (freshTable && freshTable.currentOrderId) {
          const existingOrder = await ordersRepository.getById(freshTable.currentOrderId);
          setSelectedTable(freshTable);
          setSelectedOrder(existingOrder);
        }
        setSubmittingTableId(null);
        return;
      }

      // 1. Create order for Table
      const devId = await getOrRegisterDeviceId();
      const newOrder = await ordersRepository.create({
        orderNumber: Date.now() % 10000,
        companyId: 'comp-1',
        tableId: table.id,
        deviceId: devId,
        origin: 'TABLE',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal: 0,
        discount: 0,
        serviceFee: 0,
        deliveryFee: 0,
        total: 0,
        items: [],
        notes: `Comanda de Atendimento — ${table.name}`,
      });

      // 2. Update Table to OCCUPIED
      const updatedTable: Table = {
        ...freshTable,
        status: 'OCCUPIED',
        currentOrderId: newOrder.id,
      };
      await tablesRepository.save(updatedTable);

      // 3. Refresh and open drawer
      await loadData();
      setSelectedTable(updatedTable);
      setSelectedOrder(newOrder);
    } catch (err) {
      console.error('Erro ao abrir mesa:', err);
    } finally {
      setSubmittingTableId(null);
    }
  };

  // Open Comanda Drawer
  const handleSelectTableCard = (table: Table) => {
    const order = ordersMap[table.id] || null;
    setSelectedTable(table);
    setSelectedOrder(order);
  };

  // Add Item to Order
  const handleAddItemToOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedProductId || isSubmittingItem) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    try {
      setIsSubmittingItem(true);
      const unitPriceCents = product.price;
      const itemSubtotalCents = unitPriceCents * quantity;

      const newItem: OrderItem = {
        id: crypto.randomUUID(),
        orderId: selectedOrder.id,
        productId: product.id,
        productNameSnapshot: product.name,
        unitPrice: unitPriceCents,
        quantity,
        subtotal: itemSubtotalCents,
        notes: itemNotes.trim() || undefined,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedItems = [...(selectedOrder.items || []), newItem];
      const newSubtotal = updatedItems.reduce((acc, it) => acc + it.subtotal, 0);

      const updatedOrder: Order = {
        ...selectedOrder,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newSubtotal,
      };

      await ordersRepository.update(updatedOrder);

      // Reset form
      setSelectedProductId('');
      setQuantity(1);
      setItemNotes('');
      setIsAddItemOpen(false);

      // Refresh data
      await loadData();
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Helper for Status Badge
  const renderStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'FREE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 select-none">
            🟢 Livre
          </span>
        );
      case 'OCCUPIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 select-none">
            🟠 Ocupada
          </span>
        );
      case 'WAITING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-red-50 text-red-700 border border-red-200 select-none">
            🔴 Ag. Pagamento
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300 select-none">
            ⚫ Bloqueada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mesas e Comandas"
        description="Gestão operacional de consumo presencial no salão."
        id="mesas-header"
        primaryAction={
          <Button
            id="mesas-refresh-btn"
            size="sm"
            variant="outline"
            onClick={loadData}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> Atualizar Salão
          </Button>
        }
      />

      {/* Mesas Legend Helper */}
      <div className="flex flex-wrap gap-4 items-center justify-start p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs">
        <span className="flex items-center gap-1.5"><span className="text-emerald-500">🟢</span> Livre</span>
        <span className="flex items-center gap-1.5"><span className="text-amber-500">🟠</span> Ocupada</span>
        <span className="flex items-center gap-1.5"><span className="text-red-500">🔴</span> Aguardando Pagamento</span>
        <span className="flex items-center gap-1.5"><span className="text-slate-500">⚫</span> Bloqueada</span>
      </div>

      {loading ? (
        <LoadingState id="mesas-loading" message="Carregando salão de mesas..." />
      ) : (
        /* Mesas Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {tables.map(table => {
            const order = ordersMap[table.id];
            const isSubmittingThis = submittingTableId === table.id;

            let cardStyle = 'border-slate-200 bg-white hover:border-slate-300';
            if (table.status === 'FREE') {
              cardStyle = 'border-emerald-200 bg-emerald-50/10 hover:border-emerald-300';
            } else if (table.status === 'OCCUPIED') {
              cardStyle = 'border-amber-200 bg-amber-50/10 hover:border-amber-300';
            } else if (table.status === 'WAITING_PAYMENT') {
              cardStyle = 'border-red-200 bg-red-50/10 hover:border-red-300';
            } else if (table.status === 'BLOCKED') {
              cardStyle = 'border-slate-200 bg-slate-100/50 opacity-75';
            }

            return (
              <div
                key={table.id}
                id={`table-card-${table.number}`}
                className={`border rounded-xl p-4 flex flex-col justify-between transition-all duration-150 shadow-2xs ${cardStyle}`}
              >
                {/* Header: Table number & Status Badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Grid className="w-4 h-4 text-slate-500" />
                      {table.name}
                    </span>
                    {renderStatusBadge(table.status)}
                  </div>

                  <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Capacidade: {table.capacity} pessoas
                  </p>
                </div>

                {/* Comanda details / Total */}
                <div className="my-3 py-2 border-y border-slate-100/80 flex flex-col gap-1">
                  {table.status === 'OCCUPIED' || table.status === 'WAITING_PAYMENT' ? (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Comanda:</span>
                        <span className="font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {order?.localId || 'YML-1000'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Consumo:</span>
                        <span className="font-black text-slate-950 text-sm">
                          {formatCentsToBRL(order?.total || 0)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                      <span>Sem comanda ativa</span>
                      <span>R$ 0,00</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto">
                  {table.status === 'FREE' && (
                    <Button
                      id={`btn-open-table-${table.number}`}
                      className="w-full min-h-[44px] text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isSubmittingThis}
                      onClick={() => handleOpenTable(table)}
                    >
                      {isSubmittingThis ? 'Abrindo...' : 'ABRIR MESA'}
                    </Button>
                  )}

                  {(table.status === 'OCCUPIED' || table.status === 'WAITING_PAYMENT') && (
                    <Button
                      id={`btn-view-table-${table.number}`}
                      variant="outline"
                      className="w-full min-h-[44px] text-xs font-extrabold border-slate-300 text-slate-800 hover:bg-slate-50"
                      onClick={() => handleSelectTableCard(table)}
                    >
                      <Utensils className="w-3.5 h-3.5 mr-1 text-amber-600" />
                      ACESSAR COMANDA
                    </Button>
                  )}

                  {table.status === 'BLOCKED' && (
                    <Button
                      id={`btn-blocked-table-${table.number}`}
                      variant="outline"
                      disabled
                      className="w-full min-h-[44px] text-xs font-extrabold border-slate-200 text-slate-400 bg-slate-50"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1" />
                      MESA BLOQUEADA
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER COMANDA OPERACIONAL */}
      <Drawer
        id="table-comanda-drawer"
        isOpen={Boolean(selectedTable)}
        onClose={() => {
          setSelectedTable(null);
          setSelectedOrder(null);
        }}
        title={`Comanda — ${selectedTable?.name || ''}`}
      >
        {selectedTable && (
          <div className="flex flex-col gap-5 py-2">
            {/* Header info */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Código da Comanda</span>
                <h4 className="text-base font-black text-slate-900">{selectedOrder?.localId || 'Sem Pedido'}</h4>
              </div>
              <div className="flex flex-col items-end gap-1">
                {renderStatusBadge(selectedTable.status)}
                <span className="text-[10px] font-bold text-slate-500 uppercase">Origem: SALÃO</span>
              </div>
            </div>

            {/* Items List */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Itens Consumidos ({selectedOrder?.items?.length || 0})
                </h5>
                {selectedTable.status === 'OCCUPIED' && (
                  <Button
                    id="drawer-add-item-btn"
                    size="sm"
                    className="text-xs py-1 px-3 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => setIsAddItemOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Produto
                  </Button>
                )}
              </div>

              {!selectedOrder?.items || selectedOrder.items.length === 0 ? (
                <EmptyState
                  id="empty-comanda-items"
                  title="Comanda vazia"
                  description="Ainda não foram lançados produtos nesta mesa."
                />
              ) : (
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black">
                            {item.quantity}x
                          </span>
                          <span>{item.productNameSnapshot}</span>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">
                            Obs: {item.notes}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Unitário: {formatCentsToBRL(item.unitPrice)}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-950 text-sm">
                        {formatCentsToBRL(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal Consumido:</span>
                <span className="font-bold text-white">{formatCentsToBRL(selectedOrder?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-800">
                <span>Total da Mesa:</span>
                <span className="text-amber-400 text-base">{formatCentsToBRL(selectedOrder?.total || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* DIALOG ADD ITEM TO COMANDA */}
      <Dialog
        id="add-item-dialog"
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        title="Lançar Produto na Comanda"
      >
        <form onSubmit={handleAddItemToOrder} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Selecione o Produto *
            </label>
            <select
              required
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:border-amber-500 outline-none font-medium"
            >
              <option value="">-- Selecione um produto --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCentsToBRL(p.price)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quantidade *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center py-2 border border-slate-200 rounded-lg font-extrabold text-sm outline-none"
              />
              <button
                type="button"
                className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-100"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Sem molho, bem passado..."
              value={itemNotes}
              onChange={e => setItemNotes(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:border-amber-500 outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button
              id="add-item-cancel-btn"
              type="button"
              variant="outline"
              className="flex-1 text-xs py-2.5"
              onClick={() => setIsAddItemOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              id="add-item-submit-btn"
              type="submit"
              disabled={!selectedProductId || isSubmittingItem}
              className="flex-1 text-xs py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold"
            >
              {isSubmittingItem ? 'Lançando...' : 'Confirmar Lançamento'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

// 4. COZINHA VIEW (KDS)
export function CozinhaView() {
  const { path } = useRouter();
  const [tickets, setTickets] = useState<ProductionTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<ProductionStationType | 'ALL'>('ALL');
  const [now, setNow] = useState(Date.now());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Auto-select station based on route path
  useEffect(() => {
    if (path.includes('/cozinha/bar')) {
      setSelectedStation('BAR');
    } else if (path.includes('/cozinha/ice-cream') || path.includes('/cozinha/sorveteria')) {
      setSelectedStation('ICE_CREAM');
    } else if (path.includes('/cozinha/kitchen') || path.includes('/cozinha/cozinha')) {
      setSelectedStation('KITCHEN');
    }
  }, [path]);

  // Load and sync production tickets
  const loadTickets = async () => {
    try {
      await productionRepository.syncTicketsFromOrders();
      const list = await productionRepository.getAllTickets();
      setTickets(list);
    } catch (err) {
      console.error('Erro ao carregar tickets do KDS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000); // 1-second live clock update
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (ticketId: string, nextStatus: ProductionStatus) => {
    if (updatingId === ticketId) return;
    try {
      setUpdatingId(ticketId);
      await productionRepository.updateTicketStatus(ticketId, nextStatus);
      await loadTickets();
    } catch (err) {
      console.error('Erro ao atualizar status do ticket KDS:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Station badges helper
  const getStationBadge = (station: ProductionStationType) => {
    switch (station) {
      case 'BAR':
        return { label: 'Bar', icon: '☕', class: 'bg-sky-100 text-sky-800 border-sky-300' };
      case 'ICE_CREAM':
        return { label: 'Sorveteria', icon: '🍦', class: 'bg-pink-100 text-pink-800 border-pink-300' };
      case 'KITCHEN':
      default:
        return { label: 'Cozinha', icon: '🍳', class: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
  };

  // Helper to format origin
  const getOriginInfo = (ticket: ProductionTicket) => {
    if (ticket.tableName || ticket.tableNumber) {
      return {
        label: ticket.tableName || `Mesa ${ticket.tableNumber}`,
        class: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      };
    }
    if (ticket.orderOrigin === 'DELIVERY') {
      return {
        label: '🚴 Delivery',
        class: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    if (ticket.orderOrigin === 'CATALOG' || ticket.orderOrigin === 'WHATSAPP') {
      return {
        label: ticket.customerName ? `📱 ${ticket.customerName}` : '📱 Catálogo Digital',
        class: 'bg-purple-50 text-purple-700 border-purple-200'
      };
    }
    return {
      label: 'Balcão / PDV',
      class: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  };

  // Format elapsed time in MM:SS
  const formatElapsedTime = (createdAtISO: string) => {
    const created = new Date(createdAtISO).getTime();
    const diffSec = Math.max(0, Math.floor((now - created) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return {
      minutes: mins,
      formatted: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    };
  };

  // Priority indicator helper
  const getPriorityInfo = (createdAtISO: string) => {
    const { minutes } = formatElapsedTime(createdAtISO);
    if (minutes >= 20) {
      return {
        label: 'URGENTE',
        timeClass: 'text-red-700 font-black flex items-center gap-1',
        borderClass: 'border-red-300 ring-2 ring-red-200 bg-red-50/20',
        badgeClass: 'bg-red-600 text-white animate-pulse',
        isUrgent: true
      };
    }
    if (minutes >= 10) {
      return {
        label: 'Atenção',
        timeClass: 'text-amber-700 font-extrabold flex items-center gap-1',
        borderClass: 'border-amber-300 bg-amber-50/10',
        badgeClass: 'bg-amber-500 text-white',
        isUrgent: false
      };
    }
    return {
      label: 'Normal',
      timeClass: 'text-slate-600 font-bold flex items-center gap-1',
      borderClass: 'border-slate-200',
      badgeClass: 'bg-slate-200 text-slate-700',
      isUrgent: false
    };
  };

  // Filtered tickets
  const filtered = selectedStation === 'ALL'
    ? tickets
    : tickets.filter(t => t.station === selectedStation);

  const novos = filtered.filter(t => t.status === 'PENDING');
  const preparo = filtered.filter(t => t.status === 'PREPARING');
  const prontos = filtered.filter(t => t.status === 'READY');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Monitor de Preparo (KDS)"
        description="Painel tático de produção local-first para Cozinha, Bar e Sorveteria."
        id="cozinha-header"
        primaryAction={
          <Button
            id="kds-refresh-btn"
            variant="outline"
            size="sm"
            onClick={loadTickets}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar KDS
          </Button>
        }
      />

      {/* Station Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">Setor:</span>
          
          <button
            id="kds-filter-all"
            onClick={() => setSelectedStation('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              selectedStation === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos os Setores ({tickets.length})
          </button>

          <button
            id="kds-filter-kitchen"
            onClick={() => setSelectedStation('KITCHEN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              selectedStation === 'KITCHEN'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>🍳</span> Cozinha ({tickets.filter(t => t.station === 'KITCHEN').length})
          </button>

          <button
            id="kds-filter-bar"
            onClick={() => setSelectedStation('BAR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              selectedStation === 'BAR'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
            }`}
          >
            <span>☕</span> Bar ({tickets.filter(t => t.station === 'BAR').length})
          </button>

          <button
            id="kds-filter-icecream"
            onClick={() => setSelectedStation('ICE_CREAM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              selectedStation === 'ICE_CREAM'
                ? 'bg-pink-600 text-white shadow-2xs'
                : 'bg-pink-50 text-pink-800 border border-pink-200 hover:bg-pink-100'
            }`}
          >
            <span>🍦</span> Sorveteria ({tickets.filter(t => t.station === 'ICE_CREAM').length})
          </button>
        </div>

        <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          KDS Local-First Operacional
        </div>
      </div>

      {loading ? (
        <LoadingState message="Sincronizando fila de produção do KDS..." id="kds-loading" />
      ) : (
        /* KDS Kanban 3-Columns Layout */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: NOVOS (PENDING) */}
          <div className="flex flex-col gap-4 bg-slate-100/70 p-4 rounded-xl border border-slate-200 min-h-[500px]">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <h3 className="text-xs font-extrabold tracking-wider text-blue-700 uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                Novos Pedidos ({novos.length})
              </h3>
              <span className="text-[10px] font-bold text-slate-500">Aguardando Início</span>
            </div>

            {novos.length === 0 ? (
              <div className="p-6 text-center text-xs font-medium text-slate-400 bg-white/50 rounded-lg border border-dashed border-slate-200 my-auto">
                Nenhum pedido pendente para produção.
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {novos.map((ticket) => {
                  const stationInfo = getStationBadge(ticket.station);
                  const originInfo = getOriginInfo(ticket);
                  const priority = getPriorityInfo(ticket.createdAt);
                  const time = formatElapsedTime(ticket.createdAt);

                  return (
                    <div
                      key={ticket.id}
                      className={`border rounded-xl bg-white flex flex-col shadow-xs overflow-hidden transition-all ${priority.borderClass}`}
                    >
                      {/* Ticket Header */}
                      <div className="p-3 border-b border-slate-100 flex justify-between items-start bg-slate-50/80 gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-extrabold text-slate-900">
                              #{ticket.orderLocalId}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${originInfo.class}`}>
                              {originInfo.label}
                            </span>
                            {selectedStation === 'ALL' && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${stationInfo.class}`}>
                                {stationInfo.icon} {stationInfo.label}
                              </span>
                            )}
                          </div>
                          {ticket.notes && (
                            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              ⚠️ Obs: {ticket.notes}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className={`text-xs ${priority.timeClass}`}>
                            <Clock className="w-3.5 h-3.5" /> {time.formatted}
                          </span>
                          {priority.isUrgent && (
                            <span className="text-[9px] font-extrabold text-red-600 uppercase mt-0.5">
                              ⚠️ Prioridade Alta
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ticket Items */}
                      <div className="p-4 flex-1 flex flex-col gap-2.5">
                        {ticket.items.map((item) => (
                          <div key={item.id} className="flex flex-col gap-0.5 border-b border-slate-50 pb-1.5 last:border-none last:pb-0">
                            <div className="flex items-baseline justify-between text-xs font-bold text-slate-800">
                              <span>
                                <strong className="text-slate-950 font-black text-sm mr-1">{item.quantity}x</strong>
                                {item.productNameSnapshot}
                              </span>
                            </div>
                            {item.notes && (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-100">
                                ⚠️ {item.notes}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Ticket Action Footer */}
                      <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                        <Button
                          id={`kds-btn-start-${ticket.id}`}
                          size="sm"
                          disabled={updatingId === ticket.id}
                          onClick={() => handleStatusChange(ticket.id, 'PREPARING')}
                          className="w-full text-xs py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                        >
                          {updatingId === ticket.id ? 'Iniciando...' : 'Iniciar Preparo'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: EM PREPARO (PREPARING) */}
          <div className="flex flex-col gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200 min-h-[500px]">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2.5">
              <h3 className="text-xs font-extrabold tracking-wider text-amber-700 uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
                Em Preparo ({preparo.length})
              </h3>
              <span className="text-[10px] font-bold text-amber-600">Na Bancada</span>
            </div>

            {preparo.length === 0 ? (
              <div className="p-6 text-center text-xs font-medium text-amber-600/60 bg-white/50 rounded-lg border border-dashed border-amber-200 my-auto">
                Nenhum pedido em preparo no momento.
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {preparo.map((ticket) => {
                  const stationInfo = getStationBadge(ticket.station);
                  const originInfo = getOriginInfo(ticket);
                  const priority = getPriorityInfo(ticket.createdAt);
                  const time = formatElapsedTime(ticket.createdAt);

                  return (
                    <div
                      key={ticket.id}
                      className={`border rounded-xl bg-white flex flex-col shadow-xs overflow-hidden transition-all ${priority.borderClass}`}
                    >
                      {/* Ticket Header */}
                      <div className="p-3 border-b border-amber-100 flex justify-between items-start bg-amber-50/40 gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-extrabold text-slate-900">
                              #{ticket.orderLocalId}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${originInfo.class}`}>
                              {originInfo.label}
                            </span>
                            {selectedStation === 'ALL' && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${stationInfo.class}`}>
                                {stationInfo.icon} {stationInfo.label}
                              </span>
                            )}
                          </div>
                          {ticket.notes && (
                            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              ⚠️ Obs: {ticket.notes}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className={`text-xs ${priority.timeClass}`}>
                            <Clock className="w-3.5 h-3.5" /> {time.formatted}
                          </span>
                          {priority.isUrgent && (
                            <span className="text-[9px] font-extrabold text-red-600 uppercase mt-0.5">
                              ⚠️ Atrasado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ticket Items */}
                      <div className="p-4 flex-1 flex flex-col gap-2.5">
                        {ticket.items.map((item) => (
                          <div key={item.id} className="flex flex-col gap-0.5 border-b border-slate-50 pb-1.5 last:border-none last:pb-0">
                            <div className="flex items-baseline justify-between text-xs font-bold text-slate-800">
                              <span>
                                <strong className="text-amber-700 font-black text-sm mr-1">{item.quantity}x</strong>
                                {item.productNameSnapshot}
                              </span>
                            </div>
                            {item.notes && (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-100">
                                ⚠️ {item.notes}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Ticket Action Footer */}
                      <div className="p-3 bg-amber-50/20 border-t border-amber-100">
                        <Button
                          id={`kds-btn-ready-${ticket.id}`}
                          size="sm"
                          disabled={updatingId === ticket.id}
                          onClick={() => handleStatusChange(ticket.id, 'READY')}
                          className="w-full text-xs py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50"
                        >
                          {updatingId === ticket.id ? 'Atualizando...' : 'Marcar como Pronto'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 3: PRONTOS (READY) */}
          <div className="flex flex-col gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 min-h-[500px]">
            <div className="flex justify-between items-center border-b border-emerald-200 pb-2.5">
              <h3 className="text-xs font-extrabold tracking-wider text-emerald-700 uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                Prontos ({prontos.length})
              </h3>
              <span className="text-[10px] font-bold text-emerald-600">Aguardando Retirada</span>
            </div>

            {prontos.length === 0 ? (
              <div className="p-6 text-center text-xs font-medium text-emerald-600/60 bg-white/50 rounded-lg border border-dashed border-emerald-200 my-auto">
                Nenhum pedido pronto finalizado recentemente.
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {prontos.map((ticket) => {
                  const stationInfo = getStationBadge(ticket.station);
                  const originInfo = getOriginInfo(ticket);

                  return (
                    <div
                      key={ticket.id}
                      className="border border-emerald-200 rounded-xl bg-white flex flex-col shadow-xs overflow-hidden opacity-90 hover:opacity-100 transition-opacity"
                    >
                      {/* Ticket Header */}
                      <div className="p-3 border-b border-emerald-100 flex justify-between items-start bg-emerald-50/40 gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-extrabold text-slate-900">
                              #{ticket.orderLocalId}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${originInfo.class}`}>
                              {originInfo.label}
                            </span>
                            {selectedStation === 'ALL' && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${stationInfo.class}`}>
                                {stationInfo.icon} {stationInfo.label}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                          <Check className="w-3.5 h-3.5" /> Pronto
                        </span>
                      </div>

                      {/* Ticket Items */}
                      <div className="p-4 flex-1 flex flex-col gap-2">
                        {ticket.items.map((item) => (
                          <div key={item.id} className="flex items-baseline text-xs font-bold text-slate-500 line-through">
                            <span>{item.quantity}x {item.productNameSnapshot}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer Badge */}
                      <div className="p-3 bg-emerald-50/10 border-t border-emerald-100 text-center">
                        <span className="text-[11px] font-bold text-emerald-700">
                          ✓ Prontinho para servir / entregar
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// 5. DELIVERY VIEW
export function DeliveryView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Delivery — Entregas"
        description="Gestão de despachos de pedidos e rotas dos entregadores."
        id="delivery-header"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of shipments */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-900">Despachos Pendentes e Ativos</h3>
          <Card id="delivery-shipments-card">
            <div className="divide-y divide-slate-100">
              {[
                { order: '2039', address: 'Av. Conselheiro Furtado, 1420', courier: 'Carlos Entregador', status: 'Em Rota' },
                { order: '2042', address: 'Travessa 14 de Março, 850', courier: 'Sem Entregador', status: 'Aguardando Coleta' },
              ].map((ship, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg text-amber-600 mt-0.5">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-xs font-bold text-slate-900">Pedido #{ship.order}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {ship.address}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        {ship.courier}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    ship.status === 'Em Rota' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {ship.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Mini Dashboard */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-900">Status da Frota</h3>
          <Card id="delivery-fleet-card" className="p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-3">
              <span className="text-slate-500">Entregadores Ativos</span>
              <span className="font-extrabold text-slate-950">3 online</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {[
                { name: 'Carlos Santos (Moto)', status: 'Entregando' },
                { name: 'Felipe Melo (Bike)', status: 'Disponível' },
                { name: 'Thiago Silva (Moto)', status: 'Pausado' },
              ].map((courier, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">{courier.name}</span>
                  <span className={`text-[10px] font-bold ${
                    courier.status === 'Disponível' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded' :
                    courier.status === 'Entregando' ? 'text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded' :
                    'text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded'
                  }`}>
                    {courier.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// 6. CAIXA VIEW
export function CaixaView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fechamento e Fluxo de Caixa"
        description="Abertura, fechamento e controle financeiro diário."
        id="caixa-header"
        primaryAction={
          <Button id="caixa-close-btn" size="sm" variant="danger">
            Fechar Caixa do Dia
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics / Status */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <h3 className="text-sm font-bold text-slate-900">Movimentações Financeiras</h3>
          <Card id="caixa-moves-card">
            <div className="divide-y divide-slate-100">
              {[
                { desc: 'Abertura de Caixa', time: '08:00', val: '+ R$ 200,00', type: 'Saldo Inicial' },
                { desc: 'Venda Pedido #2022', time: '08:35', val: '+ R$ 24,50', type: 'Cartão de Débito' },
                { desc: 'Venda Pedido #2021', time: '09:12', val: '+ R$ 115,40', type: 'Pix' },
                { desc: 'Sangria de Caixa', time: '10:30', val: '- R$ 50,00', type: 'Retirada para troco' },
              ].map((move, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50/40 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">{move.desc}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{move.time} — {move.type}</span>
                  </div>
                  <span className={`text-xs font-extrabold ${move.val.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                    {move.val}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column details */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-900">Resumo Atual</h3>
          <Card id="caixa-summary-card" className="p-5 flex flex-col gap-4 bg-slate-50/50">
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-slate-500">Saldo Operacional</span>
              <span className="text-2xl font-extrabold text-slate-900">R$ 289,90</span>
            </div>

            <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 text-xs font-semibold">
              <div className="flex justify-between text-slate-500">
                <span>Dinheiro (Espécie)</span>
                <span className="text-slate-800">R$ 150,00</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Pix</span>
                <span className="text-slate-800">R$ 115,40</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Cartões</span>
                <span className="text-slate-800">R$ 24,50</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Status</span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] uppercase">
                Caixa Aberto
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
