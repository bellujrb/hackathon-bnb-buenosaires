import type { EIP1193Provider, Hex, Address } from 'viem'
import { createWalletClient, custom, type WalletClient, parseEther } from 'viem'
import { bscTestnet } from 'viem/chains'

// Minimal Privy wallet shape we rely on. At runtime, this comes from useWallets().wallets[0]
export type PrivyEvmWallet = {
	getEthereumProvider: () => Promise<EIP1193Provider>
	address?: string
}

export async function createViemClientFromPrivy(privyWallet: PrivyEvmWallet): Promise<WalletClient> {
	const provider = await privyWallet.getEthereumProvider()
	return createWalletClient({
		chain: bscTestnet,
		transport: custom(provider),
	})
}

export async function signTextWithPrivy(privyWallet: PrivyEvmWallet, message: string): Promise<Hex> {
	const client = await createViemClientFromPrivy(privyWallet)
	// Resolve current account from the connected wallet/provider
	const [addr] = (await client.getAddresses()) as [Address?]
	if (!addr) throw new Error('No connected address from Privy wallet')
	return await client.signMessage({ account: addr, message })
}

export async function sendTestnetTxn(privyWallet: PrivyEvmWallet, to: `0x${string}`, valueEth: string) {
	const client = await createViemClientFromPrivy(privyWallet)
	const [addr] = (await client.getAddresses()) as [Address?]
	if (!addr) throw new Error('No connected address from Privy wallet')
	return await client.sendTransaction({
		account: addr,
		to,
		value: parseEther(valueEth),
		chain: bscTestnet,
	})
}

