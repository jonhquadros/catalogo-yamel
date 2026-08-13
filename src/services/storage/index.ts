/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { localDB, generateLocalId } from './idb';
import {
  SyncStatus,
  SyncQueueItem,
  Role,
  Company,
  User,
  Category,
  Product,
  ProductOption,
  ProductAddon,
  Table,
  Customer,
  Order,
  OrderItem,
  OrderItemOption,
  OrderItemAddon,
  CashRegister,
  CashMovement,
  Delivery,
  Device,
  SyncEntityName,
  SyncOperationType,
  DeviceConfig,
  LocalCategory,
  LocalProduct,
  LocalTable,
  LocalCashRegister,
  OrderTotals,
  OrderCustomer,
  CashMovementType,
  PaymentMethod,
  ProductionStationType,
  ProductionStatus,
  ProductionItem,
  ProductionTicket
} from './types';

// --- SEED INITIAL DATA WITH CENTS-BASED MONETARY VALUES ---
export async function seedInitialDataIfNeeded(): Promise<void> {
  const existingCompanies = await localDB.getAll<Company>('companies');
  if (existingCompanies.length > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();
  const devId = await getOrRegisterDeviceId();

  // 1. Seed Company
  const company: Company = {
    id: 'comp-1',
    name: 'Yamel Alimentos S/A',
    tradeName: 'Yamel Hamburgueria Gourmet',
    document: '12.345.678/0001-90',
    phone: '+55 11 99999-8888',
    whatsapp: '+55 11 99999-8888',
    email: 'contato@yamel.com.br',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=128&h=128&fit=crop&q=80',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
  await localDB.put('companies', company);

  // 2. Seed Users
  const users: User[] = [
    {
      id: 'usr-1',
      name: 'João Silva (Gerente)',
      email: 'joao@yamel.com.br',
      phone: '+55 11 98888-7777',
      roleId: 'MANAGER',
      status: 'ACTIVE',
      deviceId: devId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-2',
      name: 'Carlos Garçom',
      email: 'carlos@yamel.com.br',
      roleId: 'WAITER',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const usr of users) {
    await localDB.put('users', usr);
  }

  // 3. Seed Categories
  const categories: Category[] = [
    { id: 'cat-1', name: '🔥 Mais Vendidos', description: 'Os favoritos do público', sortOrder: 1, active: true, createdAt: now, updatedAt: now },
    { id: 'cat-2', name: '🍔 Hambúrgueres', description: 'Hambúrgueres artesanais premium', sortOrder: 2, active: true, createdAt: now, updatedAt: now },
    { id: 'cat-3', name: '🍟 Acompanhamentos', description: 'Batatas e porções', sortOrder: 3, active: true, createdAt: now, updatedAt: now },
    { id: 'cat-4', name: '🥤 Bebidas', description: 'Refrigerantes e sucos trincando', sortOrder: 4, active: true, createdAt: now, updatedAt: now },
    { id: 'cat-5', name: '🍰 Sobremesas', description: 'Sua dose diária de felicidade', sortOrder: 5, active: true, createdAt: now, updatedAt: now },
  ];
  for (const cat of categories) {
    await localDB.put('categories', cat);
  }

  // 4. Seed Products (PRICES STORED AS INTEGERS REPRESENTING CENTS)
  const products: Product[] = [
    {
      id: 'prod-1',
      categoryId: 'cat-2',
      name: 'Burger Clássico',
      description: 'Blend bovino artesanal de 150g, fatias de queijo cheddar derretido, alface, tomate e molho especial Yamel.',
      price: 2490, // R$ 24,90 in Cents
      cost: 1120, // R$ 11,20 in Cents
      active: true,
      available: true,
      featured: true,
      sortOrder: 1,
      preparationTime: 12,
      sku: 'YML-BURGER-001',
      productionStation: 'KITCHEN',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'SYNCED',
      localId: 'L-101',
      deviceId: devId,
    },
    {
      id: 'prod-2',
      categoryId: 'cat-2',
      name: 'Yamel Especial',
      description: 'Dois blends bovinos de 150g, queijo cheddar duplo, bacon crocante, cebola caramelizada e molho da casa.',
      price: 3290, // R$ 32,90 in Cents
      cost: 1650,
      active: true,
      available: true,
      featured: true,
      sortOrder: 2,
      preparationTime: 15,
      sku: 'YML-BURGER-002',
      productionStation: 'KITCHEN',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'SYNCED',
      localId: 'L-102',
      deviceId: devId,
    },
    {
      id: 'prod-3',
      categoryId: 'cat-3',
      name: 'Batata Frita G',
      description: 'Porção grande de batatas fritas super crocantes, temperadas com sal fino e alecrim fresco.',
      price: 1400, // R$ 14,00 in Cents
      cost: 450,
      active: true,
      available: true,
      featured: false,
      sortOrder: 3,
      preparationTime: 7,
      sku: 'YML-SIDE-001',
      productionStation: 'KITCHEN',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'SYNCED',
      localId: 'L-103',
      deviceId: devId,
    },
    {
      id: 'prod-4',
      categoryId: 'cat-4',
      name: 'Coca-Cola Lata',
      description: 'Refrigerante Coca-Cola original lata de 350ml trincando de gelada.',
      price: 600, // R$ 6,00 in Cents
      cost: 210,
      active: true,
      available: true,
      featured: false,
      sortOrder: 4,
      sku: 'YML-DRINK-001',
      productionStation: 'BAR',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'SYNCED',
      localId: 'L-104',
      deviceId: devId,
    },
    {
      id: 'prod-5',
      categoryId: 'cat-1',
      name: 'Café Expresso Especial',
      description: 'Café de grãos selecionados da Região Mogiana, extração perfeita.',
      price: 650, // R$ 6,50 in Cents
      cost: 180,
      active: true,
      available: true,
      featured: true,
      sortOrder: 5,
      sku: 'YML-COFFEE-001',
      productionStation: 'BAR',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'SYNCED',
      localId: 'L-105',
      deviceId: devId,
    },
    {
      id: 'prod-6',
      categoryId: 'cat-1',
      name: 'Taça de Sorvete Artesanal',
      description: 'Duas bolas de sorvete de baunilha com calda de chocolate e chantilly fresco.',
      price: 1850, // R$ 18,50 in Cents
      cost: 620,
      active: true,
      available: true,
      featured: true,
      sortOrder: 6,
      sku: 'YML-ICE-001',
      productionStation: 'ICE_CREAM',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'SYNCED',
      localId: 'L-106',
      deviceId: devId,
    }
  ];
  for (const prod of products) {
    await localDB.put('products', prod);
  }

  // 5. Seed Product Options & Addons
  const options: ProductOption[] = [
    {
      id: 'opt-1',
      productId: 'prod-1',
      name: 'Ponto da Carne',
      required: true,
      minSelections: 1,
      maxSelections: 1,
      choices: [
        { id: 'ch-1', name: 'Mal Passado', additionalPrice: 0 },
        { id: 'ch-2', name: 'Ao Ponto', additionalPrice: 0 },
        { id: 'ch-3', name: 'Bem Passado', additionalPrice: 0 },
      ]
    }
  ];
  for (const opt of options) {
    await localDB.put('product_options', opt);
  }

  const addons: ProductAddon[] = [
    { id: 'add-1', productId: 'prod-1', name: 'Queijo Extra', price: 300, active: true }, // R$ 3,00
    { id: 'add-2', productId: 'prod-1', name: 'Bacon Duplo', price: 450, active: true }, // R$ 4,50
  ];
  for (const add of addons) {
    await localDB.put('product_addons', add);
  }

  // 6. Seed Tables
  const tables: Table[] = [
    { id: 'table-1', number: 1, name: 'Mesa 01', capacity: 4, status: 'FREE', active: true, createdAt: now, updatedAt: now },
    { id: 'table-2', number: 2, name: 'Mesa 02', capacity: 4, status: 'FREE', active: true, createdAt: now, updatedAt: now },
    { id: 'table-3', number: 3, name: 'Mesa 03', capacity: 4, status: 'OCCUPIED', active: true, currentOrderId: 'order-seed-1', createdAt: now, updatedAt: now },
    { id: 'table-4', number: 4, name: 'Mesa 04', capacity: 4, status: 'FREE', active: true, createdAt: now, updatedAt: now },
    { id: 'table-5', number: 5, name: 'Mesa 05', capacity: 4, status: 'FREE', active: true, createdAt: now, updatedAt: now },
    { id: 'table-6', number: 6, name: 'Mesa 06', capacity: 4, status: 'WAITING_PAYMENT', active: true, currentOrderId: 'order-seed-2', createdAt: now, updatedAt: now },
    { id: 'table-7', number: 7, name: 'Mesa 07', capacity: 4, status: 'FREE', active: true, createdAt: now, updatedAt: now },
    { id: 'table-8', number: 8, name: 'Mesa 08', capacity: 4, status: 'BLOCKED', active: true, createdAt: now, updatedAt: now },
    { id: 'table-9', number: 9, name: 'Mesa 09', capacity: 4, status: 'FREE', active: true, createdAt: now, updatedAt: now },
    { id: 'table-10', number: 10, name: 'Mesa 10', capacity: 4, status: 'FREE', active: true, createdAt: now, updatedAt: now },
  ];
  for (const tab of tables) {
    await localDB.put('tables', tab);
  }

  // 7. Seed Cash Register & Seed Open Cash Movement
  const register: CashRegister = {
    id: 'cash-1',
    companyId: 'comp-1',
    openedBy: 'usr-1',
    deviceId: devId,
    openingAmount: 15000, // R$ 150,00 in Cents
    expectedAmount: 15000,
    status: 'OPEN',
    openedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  await localDB.put('cash_registers', register);

  // 8. Seed Orders and Items
  const seedOrders: Order[] = [
    {
      id: 'order-seed-1',
      localId: 'YML-1001',
      serverId: undefined,
      orderNumber: 1001,
      companyId: 'comp-1',
      tableId: 'table-3',
      waiterId: 'usr-2',
      deviceId: devId,
      origin: 'TABLE',
      status: 'PREPARING',
      syncStatus: 'SYNCED',
      items: [
        {
          id: 'item-1',
          orderId: 'order-seed-1',
          productId: 'prod-1',
          productNameSnapshot: 'Burger Clássico',
          unitPrice: 2490, // cents
          quantity: 2,
          subtotal: 4980, // cents
          status: 'PREPARING',
          createdAt: now,
          updatedAt: now,
        }
      ],
      subtotal: 4980,
      discount: 0,
      serviceFee: 0,
      deliveryFee: 0,
      total: 4980,
      paymentStatus: 'PENDING',
      notes: 'Ponto bem passado.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'order-seed-2',
      localId: 'YML-1002',
      serverId: undefined,
      orderNumber: 1002,
      companyId: 'comp-1',
      tableId: 'table-6',
      waiterId: 'usr-2',
      deviceId: devId,
      origin: 'TABLE',
      status: 'READY',
      syncStatus: 'PENDING', // Operação local pendente de futura sincronia
      items: [
        {
          id: 'item-2',
          orderId: 'order-seed-2',
          productId: 'prod-2',
          productNameSnapshot: 'Yamel Especial',
          unitPrice: 3290,
          quantity: 1,
          subtotal: 3290,
          status: 'READY',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-3',
          orderId: 'order-seed-2',
          productId: 'prod-4',
          productNameSnapshot: 'Coca-Cola Lata',
          unitPrice: 600,
          quantity: 1,
          subtotal: 600,
          status: 'READY',
          createdAt: now,
          updatedAt: now,
        }
      ],
      subtotal: 3890,
      discount: 0,
      serviceFee: 389, // 10% de taxa de serviço (R$ 3,89)
      deliveryFee: 0,
      total: 4279, // subtotal (3890) + serviceFee (389) = 4279 cents
      paymentStatus: 'PENDING',
      createdAt: now,
      updatedAt: now,
    }
  ];
  for (const ord of seedOrders) {
    await localDB.put('orders', ord);
    for (const item of ord.items) {
      await localDB.put('order_items', item);
    }
  }

  // 9. Seed Registered Device config
  const device: Device = {
    id: devId,
    name: 'Terminal Central PDV',
    type: 'CASHIER',
    userId: 'usr-1',
    lastSeen: now,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
  await localDB.put('devices', device);

  // Sync tickets for initial seed orders
  try {
    await productionRepository.syncTicketsFromOrders();
  } catch (e) {
    console.warn('Erro ao gerar tickets de produção iniciais:', e);
  }
}

// --- DEVICE COMPATIBILITY FUNCTIONS ---
export async function getOrRegisterDeviceId(): Promise<string> {
  const configs = await localDB.getAll<DeviceConfig>('device_config');
  if (configs.length > 0) {
    return configs[0].deviceId;
  }

  const newId = generateLocalId();
  const config: DeviceConfig = {
    deviceId: newId,
    deviceName: 'Terminal ' + newId.substring(0, 5).toUpperCase(),
    deviceType: 'CAIXA',
    lastSeen: new Date().toISOString(),
  };

  await localDB.put('device_config', config);
  return newId;
}

export async function getDeviceConfig(): Promise<DeviceConfig | null> {
  const configs = await localDB.getAll<DeviceConfig>('device_config');
  return configs[0] || null;
}

// --- 1. REPOSITÓRIO DE PRODUTOS ---
export const productsRepository = {
  async getAll(): Promise<Product[]> {
    const list = await localDB.getAll<Product>('products');
    // Filtro de Soft Delete
    return list.filter(item => !item.deletedAt);
  },

  async getById(id: string): Promise<Product | null> {
    const item = await localDB.get<Product>('products', id);
    if (item && item.deletedAt) return null;
    return item;
  },

  async save(product: Product): Promise<void> {
    const now = new Date().toISOString();
    const isNew = !(await localDB.get('products', product.id));
    
    product.updatedAt = now;
    if (isNew) {
      product.createdAt = now;
    }

    await localDB.put('products', product);

    // Enfileirar no outbox para sincronização futura
    await syncQueueRepository.enqueue(
      'product',
      product.id,
      isNew ? 'CREATE' : 'UPDATE',
      product,
      product.deviceId
    );
  },

  async delete(id: string, deviceId: string): Promise<void> {
    const product = await this.getById(id);
    if (product) {
      const now = new Date().toISOString();
      product.deletedAt = now;
      product.updatedAt = now;
      await localDB.put('products', product);

      await syncQueueRepository.enqueue(
        'product',
        id,
        'DELETE',
        { id, deletedAt: now },
        deviceId
      );
    }
  },

  async getOptions(productId: string): Promise<ProductOption[]> {
    return localDB.getByIndex<ProductOption>('product_options', 'productId', productId);
  },

  async getAddons(productId: string): Promise<ProductAddon[]> {
    return localDB.getByIndex<ProductAddon>('product_addons', 'productId', productId);
  }
};

// --- 2. REPOSITÓRIO DE CATEGORIAS ---
export const categoriesRepository = {
  async getAll(): Promise<Category[]> {
    const list = await localDB.getAll<Category>('categories');
    return list.filter(item => !item.deletedAt);
  },

  async getById(id: string): Promise<Category | null> {
    const item = await localDB.get<Category>('categories', id);
    if (item && item.deletedAt) return null;
    return item;
  },

  async save(category: Category): Promise<void> {
    const now = new Date().toISOString();
    const isNew = !(await localDB.get('categories', category.id));

    category.updatedAt = now;
    if (isNew) {
      category.createdAt = now;
    }

    await localDB.put('categories', category);

    await syncQueueRepository.enqueue(
      'category',
      category.id,
      isNew ? 'CREATE' : 'UPDATE',
      category,
      'device-local'
    );
  },

  async delete(id: string): Promise<void> {
    const category = await this.getById(id);
    if (category) {
      const now = new Date().toISOString();
      category.deletedAt = now;
      category.updatedAt = now;
      await localDB.put('categories', category);

      await syncQueueRepository.enqueue(
        'category',
        id,
        'DELETE',
        { id, deletedAt: now },
        'device-local'
      );
    }
  }
};

// --- 3. REPOSITÓRIO DE PEDIDOS ---
export const ordersRepository = {
  async getAll(): Promise<Order[]> {
    const list = await localDB.getAll<Order>('orders');
    return list.filter(item => !item.deletedAt);
  },

  async getById(id: string): Promise<Order | null> {
    const item = await localDB.get<Order>('orders', id);
    if (item && item.deletedAt) return null;
    return item;
  },

  async create(orderData: Omit<Order, 'id' | 'localId' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'deletedAt'>): Promise<Order> {
    const id = generateLocalId();
    const all = await this.getAll();
    const sequential = all.length + 1001;
    const localId = `YML-${sequential}`;
    const now = new Date().toISOString();

    const order: Order = {
      ...orderData,
      id,
      localId,
      syncStatus: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    // Salva o pedido localmente (Local-First)
    await localDB.put('orders', order);

    // Salva os itens vinculados ao pedido
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        item.orderId = id;
        item.createdAt = now;
        item.updatedAt = now;
        await localDB.put('order_items', item);
      }
    }

    // Registra na outbox para futuras sincronizações
    await syncQueueRepository.enqueue(
      'order',
      id,
      'CREATE',
      order,
      order.deviceId
    );

    // Gerar automaticamente os tickets de produção do KDS
    try {
      await productionRepository.syncTicketsFromOrders();
    } catch (err) {
      console.warn('Erro ao gerar tickets de produção:', err);
    }

    return order;
  },

  async update(order: Order): Promise<void> {
    const now = new Date().toISOString();
    order.updatedAt = now;
    await localDB.put('orders', order);

    // Sincroniza as alterações no outbox
    await syncQueueRepository.enqueue(
      'order',
      order.id,
      'UPDATE',
      order,
      order.deviceId
    );

    // Atualiza/sincroniza tickets no KDS
    try {
      await productionRepository.syncTicketsFromOrders();
    } catch (err) {
      console.warn('Erro ao sincronizar tickets de produção:', err);
    }
  }
};

// --- HELPER DE SETOR DE PRODUÇÃO ---
export function getStationForProduct(
  product?: Product | null,
  productNameSnapshot?: string
): ProductionStationType {
  if (product?.productionStation) {
    return product.productionStation;
  }
  const name = (productNameSnapshot || product?.name || '').toLowerCase();
  if (
    name.includes('coca') ||
    name.includes('café') ||
    name.includes('cafe') ||
    name.includes('bebida') ||
    name.includes('suco') ||
    name.includes('refrigerante') ||
    name.includes('lata') ||
    name.includes('cappuccino') ||
    name.includes('chopp') ||
    name.includes('cerveja')
  ) {
    return 'BAR';
  }
  if (
    name.includes('sorvete') ||
    name.includes('açaí') ||
    name.includes('acai') ||
    name.includes('taça') ||
    name.includes('picolé') ||
    name.includes('gelato')
  ) {
    return 'ICE_CREAM';
  }
  return 'KITCHEN';
}

// --- REPOSITÓRIO DE PRODUÇÃO (KDS) ---
export const productionRepository = {
  async getAllTickets(): Promise<ProductionTicket[]> {
    const list = await localDB.getAll<ProductionTicket>('production_tickets');
    return list.filter(t => !t.deletedAt);
  },

  async getTicketsByStation(station: ProductionStationType | 'ALL'): Promise<ProductionTicket[]> {
    const all = await this.getAllTickets();
    if (station === 'ALL') return all;
    return all.filter(t => t.station === station);
  },

  async updateTicketStatus(
    ticketId: string,
    newStatus: ProductionStatus
  ): Promise<ProductionTicket> {
    const ticket = await localDB.get<ProductionTicket>('production_tickets', ticketId);
    if (!ticket) throw new Error('Ticket de produção não encontrado');

    const now = new Date().toISOString();
    ticket.status = newStatus;
    ticket.updatedAt = now;

    ticket.items = ticket.items.map(item => ({
      ...item,
      status: newStatus,
      updatedAt: now
    }));

    await localDB.put('production_tickets', ticket);

    const devId = await getOrRegisterDeviceId();
    await syncQueueRepository.enqueue(
      'production_ticket',
      ticket.id,
      'UPDATE',
      ticket,
      devId
    );

    return ticket;
  },

  /**
   * Gerador Idempotente de Tickets de Produção a partir de Pedidos ativos no IndexedDB.
   */
  async syncTicketsFromOrders(): Promise<ProductionTicket[]> {
    const orders = await ordersRepository.getAll();
    const existingTickets = await this.getAllTickets();
    const allProducts = await productsRepository.getAll();
    const productMap = new Map<string, Product>(allProducts.map(p => [p.id, p]));
    const allTables = await tablesRepository.getAll();
    const tableMap = new Map<string, Table>(allTables.map(t => [t.id, t]));

    const devId = await getOrRegisterDeviceId();
    const now = new Date().toISOString();

    const ticketMap = new Map<string, ProductionTicket>();
    for (const t of existingTickets) {
      ticketMap.set(`${t.orderId}-${t.station}`, t);
    }

    const activeOrders = orders.filter(o => o.status !== 'CANCELLED' && o.items && o.items.length > 0);

    for (const order of activeOrders) {
      const itemsByStation = new Map<ProductionStationType, OrderItem[]>();

      for (const item of order.items) {
        if (item.status === 'CANCELLED') continue;

        const prod = productMap.get(item.productId);
        const station = getStationForProduct(prod, item.productNameSnapshot);

        if (!itemsByStation.has(station)) {
          itemsByStation.set(station, []);
        }
        itemsByStation.get(station)!.push(item);
      }

      for (const [station, items] of itemsByStation.entries()) {
        const ticketKey = `${order.id}-${station}`;
        const existing = ticketMap.get(ticketKey);

        if (!existing) {
          const table = order.tableId ? tableMap.get(order.tableId) : undefined;

          const prodItems: ProductionItem[] = items.map(item => ({
            id: item.id || generateLocalId(),
            orderItemId: item.id,
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            quantity: item.quantity,
            notes: item.notes,
            status: item.status === 'PREPARING' ? 'PREPARING' : item.status === 'READY' ? 'READY' : 'PENDING',
            createdAt: item.createdAt || order.createdAt || now,
            updatedAt: now,
          }));

          let ticketStatus: ProductionStatus = 'PENDING';
          if (prodItems.every(i => i.status === 'READY')) {
            ticketStatus = 'READY';
          } else if (prodItems.some(i => i.status === 'PREPARING' || i.status === 'READY')) {
            ticketStatus = 'PREPARING';
          }

          const newTicket: ProductionTicket = {
            id: `ticket-${order.id}-${station}`,
            orderId: order.id,
            orderLocalId: order.localId || `YML-${order.orderNumber}`,
            orderOrigin: order.origin,
            station,
            tableNumber: table?.number,
            tableName: table?.name,
            customerName: order.customerSnapshot?.name,
            customerPhone: order.customerSnapshot?.phone,
            deliveryType: order.fulfillmentType,
            status: ticketStatus,
            items: prodItems,
            notes: order.notes,
            syncStatus: 'PENDING',
            deviceId: order.deviceId || devId,
            createdAt: order.createdAt || now,
            updatedAt: now,
          };

          await localDB.put('production_tickets', newTicket);
          await syncQueueRepository.enqueue(
            'production_ticket',
            newTicket.id,
            'CREATE',
            newTicket,
            devId
          );
          ticketMap.set(ticketKey, newTicket);
        } else {
          // Ticket já existe para essa ordem + estação: verificar se há novos itens adicionados posteriormente
          let hasNewItems = false;
          const existingItemMap = new Map(existing.items.map(i => [i.orderItemId, i]));

          for (const item of items) {
            if (!existingItemMap.has(item.id)) {
              const newItem: ProductionItem = {
                id: item.id || generateLocalId(),
                orderItemId: item.id,
                productId: item.productId,
                productNameSnapshot: item.productNameSnapshot,
                quantity: item.quantity,
                notes: item.notes,
                status: item.status === 'PREPARING' ? 'PREPARING' : item.status === 'READY' ? 'READY' : 'PENDING',
                createdAt: item.createdAt || order.createdAt || now,
                updatedAt: now,
              };
              existing.items.push(newItem);
              hasNewItems = true;
            }
          }

          if (hasNewItems) {
            existing.updatedAt = now;
            // Recalcular o status do ticket preservando o progresso mas acomodando novos itens
            let updatedStatus: ProductionStatus = 'PENDING';
            if (existing.items.every(i => i.status === 'READY')) {
              updatedStatus = 'READY';
            } else if (existing.items.some(i => i.status === 'PREPARING' || i.status === 'READY')) {
              updatedStatus = 'PREPARING';
            }
            existing.status = updatedStatus;

            await localDB.put('production_tickets', existing);
            await syncQueueRepository.enqueue(
              'production_ticket',
              existing.id,
              'UPDATE',
              existing,
              devId
            );
          }
        }
      }
    }

    return Array.from(ticketMap.values());
  }
};

// --- 4. REPOSITÓRIO DE MESAS ---
export const tablesRepository = {
  async getAll(): Promise<Table[]> {
    let list = await localDB.getAll<Table>('tables');
    list = list.filter(item => !item.deletedAt);
    if (list.length === 0) {
      const now = new Date().toISOString();
      const defaultTables: Table[] = Array.from({ length: 10 }, (_, i) => ({
        id: `table-${i + 1}`,
        number: i + 1,
        name: `Mesa ${String(i + 1).padStart(2, '0')}`,
        capacity: 4,
        status: 'FREE',
        active: true,
        createdAt: now,
        updatedAt: now,
      }));
      for (const t of defaultTables) {
        await localDB.put('tables', t);
      }
      return defaultTables;
    }
    return list.sort((a, b) => a.number - b.number);
  },

  async getById(id: string): Promise<Table | null> {
    const item = await localDB.get<Table>('tables', id);
    if (item && item.deletedAt) return null;
    return item;
  },

  async save(table: Table): Promise<void> {
    const now = new Date().toISOString();
    const isNew = !(await localDB.get('tables', table.id));
    
    table.updatedAt = now;
    if (isNew) {
      table.createdAt = now;
    }

    await localDB.put('tables', table);

    await syncQueueRepository.enqueue(
      'table',
      table.id,
      isNew ? 'CREATE' : 'UPDATE',
      table,
      'device-local'
    );
  }
};

// --- 5. REPOSITÓRIO DE CLIENTES ---
export const customersRepository = {
  async getAll(): Promise<Customer[]> {
    const list = await localDB.getAll<Customer>('customers');
    return list.filter(item => !item.deletedAt);
  },

  async getById(id: string): Promise<Customer | null> {
    const item = await localDB.get<Customer>('customers', id);
    if (item && item.deletedAt) return null;
    return item;
  },

  async save(customer: Customer): Promise<void> {
    const now = new Date().toISOString();
    const isNew = !(await localDB.get('customers', customer.id));

    customer.updatedAt = now;
    if (isNew) {
      customer.createdAt = now;
    }

    await localDB.put('customers', customer);

    await syncQueueRepository.enqueue(
      'customer',
      customer.id,
      isNew ? 'CREATE' : 'UPDATE',
      customer,
      'device-local'
    );
  }
};

// --- 6. REPOSITÓRIO DE FLUXO DE CAIXA ---
export const cashRepository = {
  async getOpenRegister(): Promise<CashRegister | null> {
    const registers = await localDB.getAll<CashRegister>('cash_registers');
    const open = registers.find(r => r.status === 'OPEN');
    return open || null;
  },

  async open(openingAmount: number, userId: string, deviceId: string): Promise<CashRegister> {
    const open = await this.getOpenRegister();
    if (open) {
      throw new Error('Já existe um caixa aberto para este terminal');
    }

    const id = generateLocalId();
    const now = new Date().toISOString();
    const register: CashRegister = {
      id,
      companyId: 'comp-1',
      openedBy: userId,
      deviceId,
      openingAmount,
      expectedAmount: openingAmount,
      status: 'OPEN',
      openedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await localDB.put('cash_registers', register);

    await syncQueueRepository.enqueue(
      'cash_register',
      id,
      'CREATE',
      register,
      deviceId
    );

    return register;
  },

  async close(registerId: string, closingAmount: number, userId: string): Promise<CashRegister> {
    const register = await localDB.get<CashRegister>('cash_registers', registerId);
    if (!register) {
      throw new Error('Registro de caixa não encontrado');
    }

    const movements = await this.getMovements(registerId);
    // Calcular o saldo esperado com base em centavos inteiros
    let expected = register.openingAmount;
    for (const mov of movements) {
      if (mov.type === 'SALE' || mov.type === 'DEPOSIT') {
        expected += mov.amount;
      } else if (mov.type === 'REFUND' || mov.type === 'WITHDRAWAL') {
        expected -= mov.amount;
      }
    }

    const now = new Date().toISOString();
    register.status = 'CLOSED';
    register.closedBy = userId;
    register.closedAt = now;
    register.closingAmount = closingAmount;
    register.expectedAmount = expected;
    register.difference = closingAmount - expected;
    register.updatedAt = now;

    await localDB.put('cash_registers', register);

    await syncQueueRepository.enqueue(
      'cash_register',
      registerId,
      'UPDATE',
      register,
      register.deviceId
    );

    return register;
  },

  async addMovement(
    cashRegisterId: string,
    type: CashMovementType,
    amount: number,
    paymentMethod: PaymentMethod,
    description: string,
    userId: string
  ): Promise<CashMovement> {
    const id = generateLocalId();
    const now = new Date().toISOString();

    const movement: CashMovement = {
      id,
      cashRegisterId,
      type,
      amount,
      paymentMethod,
      description,
      userId,
      createdAt: now,
    };

    await localDB.put('cash_movements', movement);

    await syncQueueRepository.enqueue(
      'cash_movement',
      id,
      'CREATE',
      movement,
      'device-local'
    );

    return movement;
  },

  async getMovements(cashRegisterId: string): Promise<CashMovement[]> {
    return localDB.getByIndex<CashMovement>('cash_movements', 'cashRegisterId', cashRegisterId);
  }
};

// --- 7. TRANSACTIONAL OUTBOX REPOSITORY ---
export const syncQueueRepository = {
  async getPending(): Promise<SyncQueueItem[]> {
    const list = await localDB.getAll<SyncQueueItem>('sync_queue');
    return list.filter(item => item.status === 'PENDING');
  },

  async enqueue(
    entity: SyncEntityName,
    entityId: string,
    operation: SyncOperationType,
    payload: any,
    deviceId: string
  ): Promise<SyncQueueItem> {
    const id = generateLocalId();
    const now = new Date().toISOString();

    const item: SyncQueueItem = {
      id,
      entity,
      entityId,
      operation,
      payload,
      status: 'PENDING',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
      deviceId,
    };

    await localDB.put('sync_queue', item);
    return item;
  },

  async updateStatus(id: string, status: SyncStatus, error?: string): Promise<void> {
    const item = await localDB.get<SyncQueueItem>('sync_queue', id);
    if (item) {
      item.status = status;
      item.attempts += 1;
      item.updatedAt = new Date().toISOString();
      item.lastAttemptAt = new Date().toISOString();
      if (error) item.error = error;
      await localDB.put('sync_queue', item);
    }
  },

  async delete(id: string): Promise<void> {
    await localDB.delete('sync_queue', id);
  }
};

// --- LEGACY BACKWARD COMPATIBLE EXPORTS ---
export async function addToSyncQueue(operation: string, payload: any): Promise<any> {
  const devId = await getOrRegisterDeviceId();
  return syncQueueRepository.enqueue('order', 'legacy-id', 'CREATE', payload, devId);
}

export async function getSyncQueue(): Promise<any[]> {
  return localDB.getAll('sync_queue');
}

export async function updateSyncQueueStatus(id: string, status: SyncStatus, error?: string): Promise<void> {
  await syncQueueRepository.updateStatus(id, status, error);
}

export async function deleteFromSyncQueue(id: string): Promise<void> {
  await syncQueueRepository.delete(id);
}

export async function getLocalProducts(): Promise<LocalProduct[]> {
  // Convert our strict cents back to decimal representation ONLY for backward-compatible rendering if needed,
  // but let's return standard object to let views display them nicely.
  return productsRepository.getAll();
}

export async function getLocalCategories(): Promise<LocalCategory[]> {
  return categoriesRepository.getAll();
}

export async function getLocalOrders(): Promise<Order[]> {
  return ordersRepository.getAll();
}

export async function createLocalOrder(orderData: any): Promise<Order> {
  // Map fields of incoming orderData to strict Order entity (using cents or converting as appropriate)
  const items: OrderItem[] = (orderData.items || []).map((item: any, index: number) => ({
    id: generateLocalId(),
    orderId: '',
    productId: item.productId,
    productNameSnapshot: item.name,
    unitPrice: typeof item.price === 'number' ? Math.round(item.price * 100) : 0, // safe conversion to cents if decimal
    quantity: item.quantity,
    subtotal: typeof item.subtotal === 'number' ? Math.round(item.subtotal * 100) : 0,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const subtotalCents = items.reduce((acc, curr) => acc + curr.subtotal, 0);
  const discountCents = typeof orderData.totals?.discount === 'number' ? Math.round(orderData.totals.discount * 100) : 0;
  const feeCents = typeof orderData.totals?.fee === 'number' ? Math.round(orderData.totals.fee * 100) : 0;
  const deliveryFeeCents = typeof orderData.deliveryFee === 'number' ? Math.round(orderData.deliveryFee * 100) : 0;
  const totalCents = subtotalCents + feeCents + deliveryFeeCents - discountCents;

  const devId = await getOrRegisterDeviceId();

  const data: Omit<Order, 'id' | 'localId' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'deletedAt'> = {
    orderNumber: Date.now() % 10000,
    companyId: 'comp-1',
    customerId: orderData.customerId,
    tableId: orderData.tableId,
    deviceId: devId,
    origin: orderData.origin || 'COUNTER',
    status: 'DRAFT',
    items,
    subtotal: subtotalCents,
    discount: discountCents,
    serviceFee: feeCents,
    deliveryFee: deliveryFeeCents,
    total: totalCents,
    paymentStatus: 'PENDING',
    notes: orderData.notes,
  };

  return ordersRepository.create(data);
}

export async function getLocalTables(): Promise<LocalTable[]> {
  return tablesRepository.getAll();
}

export async function updateTableStatus(tableId: string, status: any, activeOrderId?: string): Promise<void> {
  const table = await tablesRepository.getById(tableId);
  if (table) {
    table.status = status;
    table.currentOrderId = activeOrderId;
    await tablesRepository.save(table);
  }
}
