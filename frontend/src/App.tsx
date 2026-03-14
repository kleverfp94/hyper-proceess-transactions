import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import CreateTransaction from './pages/CreateTransaction'
import TransactionDetail from './pages/TransactionDetail'
import TransactionsList from './pages/TransactionsList'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TransactionsList />} />
        <Route path="/transacoes/:id" element={<TransactionDetail />} />
        <Route path="/nova" element={<CreateTransaction />} />
      </Routes>
    </Layout>
  )
}
