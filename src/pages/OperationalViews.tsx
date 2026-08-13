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
import {
  Table,
  Order,
  OrderItem,
  Product,
  TableStatus
} from '../services/storage/types';
import {
  tablesRepository,
  ordersRepository,
  productsRepository,
  getOrRegisterDeviceId
} from '../services/storage';

// 1. PDV VIEW (PONTO DE VENDA)
export function PdvView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="PDV — Caixa e Balcão"
        description="Frente de caixa ágil para atendimento e pedidos rápidos."
        id="pdv-header"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Content: Categories & Products Mock */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Categories bar mock */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
            {['🔥 Mais Vendidos', '🍔 Hambúrgueres', '🍟 Acompanhamentos', '🥤 Bebidas', '🍰 Sobremesas'].map((cat, idx) => (
              <span
                key={idx}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer whitespace-nowrap transition-colors ${
                  idx === 0 ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Search bar mock */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar item pelo nome ou código..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none bg-white focus:border-amber-500"
              disabled
            />
          </div>

          {/* Products Grid Mock */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { name: 'Burger Clássico', price: 'R$ 24,90', category: 'Hambúrgueres', icon: '🍔' },
              { name: 'Yamel Especial', price: 'R$ 32,90', category: 'Hambúrgueres', icon: '🍔' },
              { name: 'Batata Frita G', price: 'R$ 14,00', category: 'Acompanhamentos', icon: '🍟' },
              { name: 'Anéis de Cebola', price: 'R$ 16,50', category: 'Acompanhamentos', icon: '🍟' },
              { name: 'Coca-Cola Lata', price: 'R$ 6,00', category: 'Bebidas', icon: '🥤' },
              { name: 'Suco Natural', price: 'R$ 8,50', category: 'Bebidas', icon: '🥤' },
            ].map((prod, idx) => (
              <Card key={idx} id={`pdv-prod-${idx}`} className="cursor-pointer hover:border-amber-400 transition-all duration-150 flex flex-col justify-between p-4 group">
                <div className="text-3xl mb-2 select-none group-hover:scale-105 transition-transform duration-150">{prod.icon}</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{prod.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{prod.category}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs font-extrabold text-slate-900">{prod.price}</span>
                  <div className="p-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-200 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Content: Checkout Cart Mock */}
        <div className="flex flex-col gap-4">
          <Card id="pdv-cart" className="flex flex-col h-full bg-slate-50/50">
            <CardHeader
              id="pdv-cart-header"
              title="Sacola de Compras"
              subtitle="Cliente Balcão"
              action={<span className="text-xs font-bold text-amber-600">Mesa 5</span>}
            />
            <CardContent id="pdv-cart-body" className="flex-1 flex flex-col justify-between py-4">
              {/* Order items list mockup */}
              <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto mb-4">
                {[
                  { name: 'Yamel Especial', qty: 2, price: 'R$ 65,80' },
                  { name: 'Batata Frita G', qty: 1, price: 'R$ 14,00' },
                  { name: 'Suco Natural', qty: 1, price: 'R$ 8,50' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-white border border-slate-100 p-2.5 rounded-lg">
                    <div>
                      <h5 className="font-bold text-slate-800">{item.name}</h5>
                      <p className="text-slate-400 mt-0.5">Qtd: {item.qty} x R$ {(parseFloat(item.price.replace(/[^\d,]/g, '').replace(',', '.')) / item.qty).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <span className="font-extrabold text-slate-900">{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Summary and Action Button */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 bg-white -mx-5 -mb-4 px-5 pb-4">
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>R$ 88,30</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Taxa de Serviço</span>
                    <span>R$ 0,00</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-950">
                    <span>Total</span>
                    <span>R$ 88,30</span>
                  </div>
                </div>

                <Button id="pdv-checkout-btn" className="w-full mt-1">
                  Finalizar Pedido (R$ 88,30)
                </Button>
                
                <p className="text-[10px] text-slate-400 text-center select-none leading-tight">
                  Este módulo de PDV é uma demonstração de layout.<br />As vendas reais não serão processadas nesta fase.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// 2. PEDIDOS VIEW (MANAGEMENT)
export function PedidosView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pedidos do Dia"
        description="Gerenciamento de todos os pedidos ativos e concluídos."
        id="pedidos-header"
      />

      {/* Tabs / Filters mock */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
        <div className="flex gap-2 text-xs font-bold select-none">
          {['Todos (12)', 'Pendentes (2)', 'Em Preparo (3)', 'A Caminho (2)', 'Concluídos (5)'].map((tab, idx) => (
            <span
              key={idx}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                idx === 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      {/* Grid of active orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { id: '2042', client: 'Gabriel Santana', time: 'Há 5 min', total: 'R$ 42,90', type: 'Delivery', items: '1x Yamel Especial, 1x Coca Lata', status: 'Pendente', color: 'bg-blue-500' },
          { id: '2041', client: 'Mesa 3', time: 'Há 12 min', total: 'R$ 78,00', type: 'Mesa', items: '2x Burger Clássico, 1x Batata Frita G', status: 'Em Preparo', color: 'bg-amber-500' },
          { id: '2040', client: 'Juliana Costa', time: 'Há 25 min', total: 'R$ 18,50', type: 'Retirada', items: '1x Batata Frita G, 1x Suco Natural', status: 'Em Preparo', color: 'bg-amber-500' },
          { id: '2039', client: 'Mariana Lima', time: 'Há 45 min', total: 'R$ 55,00', type: 'Delivery', items: '1x Burger Clássico, 1x Sobremesa Doce', status: 'A Caminho', color: 'bg-indigo-500' },
        ].map((item) => (
          <Card key={item.id} id={`order-card-${item.id}`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-xs font-bold text-slate-900">#{item.id}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{item.time}</span>
            </div>
            <CardContent id={`order-card-content-${item.id}`} className="flex flex-col gap-3 py-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-950">{item.client}</h4>
                <p className="text-xs text-slate-400 mt-0.5 tracking-wider uppercase font-bold">{item.type}</p>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100/50 leading-relaxed font-medium">
                {item.items}
              </p>
              <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-1">
                <span className="text-xs text-slate-400">Total: <strong className="text-slate-900 text-sm font-extrabold">{item.total}</strong></span>
                <span className="text-xs font-bold text-amber-600 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-100">{item.status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

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
  const kdsTickets = {
    novos: [
      { order: '2043', target: 'Mesa 8', time: '1 min', items: ['1x Burger Duplo', '1x Suco de Laranja'], urgent: false },
    ],
    preparo: [
      { order: '2041', target: 'Mesa 3', time: '12 min', items: ['2x Burger Clássico', '1x Batata Frita G (Sem Sal)'], urgent: false },
      { order: '2040', target: 'Juliana C.', time: '25 min', items: ['1x Batata Frita G'], urgent: true },
    ],
    prontos: [
      { order: '2042', target: 'Gabriel S.', time: '5 min', items: ['1x Yamel Especial (Bem Passado)', '1x Coca Lata'], urgent: false },
    ]
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel da Cozinha (KDS)"
        description="Display de alto contraste para o controle de preparo dos pedidos."
        id="cozinha-header"
      />

      {/* KDS Columns Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: NOVOS */}
        <div className="flex flex-col gap-4 bg-slate-100/70 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-xs font-extrabold tracking-wider text-blue-700 uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse-slow"></span>
              Novos ({kdsTickets.novos.length})
            </h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {kdsTickets.novos.map((ticket, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl bg-white flex flex-col shadow-xs overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">#{ticket.order}</span>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase">{ticket.target}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {ticket.time}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  {ticket.items.map((it, i) => (
                    <span key={i} className="text-xs font-bold text-slate-800 leading-relaxed">• {it}</span>
                  ))}
                </div>
                <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                  <Button id={`kds-btn-prep-${idx}`} size="sm" className="w-full text-xs py-1.5 bg-blue-600 hover:bg-blue-700">
                    Iniciar Preparo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: EM PREPARO */}
        <div className="flex flex-col gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
          <div className="flex justify-between items-center border-b border-amber-200 pb-2">
            <h3 className="text-xs font-extrabold tracking-wider text-amber-700 uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
              Em Preparo ({kdsTickets.preparo.length})
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {kdsTickets.preparo.map((ticket, idx) => (
              <div key={idx} className={`border rounded-xl bg-white flex flex-col shadow-xs overflow-hidden ${ticket.urgent ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'}`}>
                <div className={`p-3 border-b flex justify-between items-center ${ticket.urgent ? 'bg-red-50/60 border-red-100' : 'bg-amber-50/30 border-amber-100'}`}>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">#{ticket.order}</span>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase">{ticket.target}</span>
                  </div>
                  <span className="text-xs font-extrabold text-red-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {ticket.time}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  {ticket.items.map((it, i) => (
                    <span key={i} className="text-xs font-bold text-slate-800 leading-relaxed">• {it}</span>
                  ))}
                </div>
                <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                  <Button id={`kds-btn-ready-${idx}`} size="sm" className="w-full text-xs py-1.5 bg-amber-600 hover:bg-amber-700">
                    Pronto p/ Entrega
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: PRONTOS */}
        <div className="flex flex-col gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
          <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
            <h3 className="text-xs font-extrabold tracking-wider text-emerald-700 uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              Prontos ({kdsTickets.prontos.length})
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {kdsTickets.prontos.map((ticket, idx) => (
              <div key={idx} className="border border-emerald-100 rounded-xl bg-white flex flex-col shadow-xs overflow-hidden">
                <div className="p-3 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/20">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">#{ticket.order}</span>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase">{ticket.target}</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Concluído
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  {ticket.items.map((it, i) => (
                    <span key={i} className="text-xs font-bold text-slate-400 line-through leading-relaxed">• {it}</span>
                  ))}
                </div>
                <div className="p-3 bg-emerald-50/10 border-t border-emerald-50">
                  <Button id={`kds-btn-archive-${idx}`} variant="outline" size="sm" className="w-full text-xs py-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    Arquivar Cartão
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
