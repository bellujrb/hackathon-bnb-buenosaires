import { SearchFilters, BackendResponse } from '../types/pipeline.types';

/**
 * Função para buscar dados de wallets no backend
 * Realiza chamada HTTP para o endpoint de busca configurado
 */
export const searchWalletData = async ({
  addresses,
  protocol,
  startDate,
  endDate,
  stablecoins,
  minAccountAge,
}: {
  addresses: string[];
  protocol?: string;
  startDate?: string;
  endDate?: string;
  stablecoins?: boolean;
  minAccountAge?: number;
}): Promise<BackendResponse> => {
    try {
      // URL do backend (configurável via env)
      const backendUrl = process.env.BACKEND_SEARCH_URL || 'http://localhost:4000/api/search/wallets';
      const timeout = parseInt(process.env.BACKEND_SEARCH_TIMEOUT || '30000', 10);

      // Construir filtros
      const filters: SearchFilters = {};

      if (protocol) filters.protocol = protocol;
      if (stablecoins !== undefined) filters.stablecoins = stablecoins;
      if (minAccountAge) filters.minAccountAge = minAccountAge;
      if (startDate || endDate) {
        filters.period = {};
        if (startDate) filters.period.startDate = startDate;
        if (endDate) filters.period.endDate = endDate;
      }

      // Payload para o backend
      const payload = {
        addresses,
        filters,
      };

      console.log('[WalletSearchTool] Calling backend:', {
        url: backendUrl,
        addressCount: addresses.length,
        filters,
      });

      // TODO: Implementar chamada HTTP real quando backend estiver pronto
      // const response = await fetch(backendUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      //   signal: AbortSignal.timeout(timeout),
      // });
      //
      // if (!response.ok) {
      //   throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      // }
      //
      // const data: BackendResponse = await response.json();

      // Por enquanto, retorna dados mockados para desenvolvimento
      const mockResponse: BackendResponse = {
        success: true,
        data: {
          totalWallets: addresses.length,
          analyzedWallets: addresses.length,
          results: addresses.slice(0, 10).map((address, index) => ({
            address,
            score: Math.floor(Math.random() * 100),
            transactions: Math.floor(Math.random() * 500) + 50,
            protocols: protocol ? [protocol] : ['PancakeSwap', 'Venus', 'Biswap'].slice(0, Math.floor(Math.random() * 3) + 1),
            accountAge: Math.floor(Math.random() * 365) + 30, // dias
            hasStablecoins: stablecoins ?? Math.random() > 0.5,
            lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            eligible: Math.random() > 0.3,
            tags: ['Active Trader', 'DeFi User'].filter(() => Math.random() > 0.5),
          })),
          summary: {
            averageScore: Math.floor(Math.random() * 100),
            eligibleWallets: Math.floor(addresses.length * 0.7),
            totalTransactions: Math.floor(addresses.length * 250),
          },
        },
        message: `Análise concluída para ${addresses.length} wallets${filters.protocol ? ` no protocolo ${filters.protocol}` : ''}.`,
      };

      console.log('[WalletSearch] Backend response:', {
        success: mockResponse.success,
        analyzedWallets: mockResponse.data?.analyzedWallets,
      });

      return mockResponse;
    } catch (error) {
      console.error('[WalletSearch] Error:', error);

      const errorResponse: BackendResponse = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Erro ao buscar dados das wallets. Tente novamente.',
      };

      return errorResponse;
    }
};
