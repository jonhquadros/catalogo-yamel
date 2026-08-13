/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DollarSign, ShoppingBag, TrendingUp, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/DataDisplay';
import { WhatsAppButton } from '../components/ui/WhatsAppButton';

export function DashboardView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação local da Yamel."
        id="dashboard-header"
        primaryAction={
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 select-none font-semibold">
            <RefreshCw className="w-3.5 h-3.5 animate-pulse-slow" />
            <span>Atualização Automática</span>
          </div>
        }
      />

      {/* Mock Data Warning Alert */}
      <div id="mock-warning-alert" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-slate-100 border border-slate-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 md:mt-0" />
          <div>
            <h4 className="text-xs font-semibold text-slate-800">Demonstração Técnica (Dados Fictícios)</h4>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
              As métricas e gráficos exibidos abaixo são dados simulados para validação visual da estrutura base. 
              A sincronização em nuvem será integrada nas próximas etapas.
            </p>
          </div>
        </div>
        
        {/* WhatsApp CTA */}
        <div className="flex flex-col gap-1 w-full md:w-auto text-left md:text-right shrink-0">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Precisa de ajuda com o sistema?</span>
          <WhatsAppButton id="dashboard-help-whatsapp" size="sm" showHelpIcon />
        </div>
      </div>


      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card id="metric-sales">
          <CardContent id="metric-sales-content" className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase select-none">Vendas Hoje</span>
              <span className="text-2xl font-extrabold text-slate-900">R$ 1.248,50</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                +14.2% <span className="text-slate-400 font-normal">vs. ontem</span>
              </span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card id="metric-orders">
          <CardContent id="metric-orders-content" className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase select-none">Pedidos Hoje</span>
              <span className="text-2xl font-extrabold text-slate-900">42</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                +8.5% <span className="text-slate-400 font-normal">vs. ontem</span>
              </span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card id="metric-ticket">
          <CardContent id="metric-ticket-content" className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase select-none">Ticket Médio</span>
              <span className="text-2xl font-extrabold text-slate-900">R$ 29,72</span>
              <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                Estável <span className="text-slate-400 font-normal">esta semana</span>
              </span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card id="metric-preparing">
          <CardContent id="metric-preparing-content" className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase select-none">Em Preparo</span>
              <span className="text-2xl font-extrabold text-slate-900">5</span>
              <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                Cozinha <span className="text-slate-400 font-normal">operando em KDS</span>
              </span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Visualization Mock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-900">Pedidos Recentes</h3>
          <Card id="recent-orders-card">
            <div className="divide-y divide-slate-100">
              {[
                { id: '1024', customer: 'João Pedro', total: 'R$ 48,90', status: 'Em Preparo', type: 'Delivery' },
                { id: '1023', customer: 'Mesa 4', total: 'R$ 82,00', status: 'Pendente', type: 'Mesa' },
                { id: '1022', customer: 'Ana Clara', total: 'R$ 24,50', status: 'Concluído', type: 'Retirada' },
                { id: '1021', customer: 'Mesa 12', total: 'R$ 115,40', status: 'Entregue', type: 'Mesa' },
              ].map((order, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-bold text-slate-400 select-none">#{order.id}</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-950">{order.customer}</span>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{order.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-800">{order.total}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      order.status === 'Em Preparo' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      order.status === 'Pendente' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      order.status === 'Concluído' || order.status === 'Entregue' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Performance Overview Chart Placeholder */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-900">Operação por Canal</h3>
          <Card id="channel-overview-card" className="p-5 flex flex-col justify-between h-full min-h-[220px]">
            <div className="flex flex-col gap-3">
              {[
                { name: 'Delivery App', value: '45%', count: '18 pedidos', color: 'bg-amber-600' },
                { name: 'Mesas / Salão', value: '35%', count: '15 pedidos', color: 'bg-emerald-600' },
                { name: 'Retirada (Takeout)', value: '20%', count: '9 pedidos', color: 'bg-blue-600' },
              ].map((channel, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{channel.name}</span>
                    <span className="text-slate-900">{channel.value} <span className="text-slate-400 font-normal">({channel.count})</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${channel.color}`} style={{ width: channel.value }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold text-slate-400 text-center uppercase select-none mt-4">
              Canal de Distribuição Simulado
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
