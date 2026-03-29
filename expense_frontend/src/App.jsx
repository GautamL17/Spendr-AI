import {Routes, Route, Link} from 'react-router-dom'
import Chart from './components/ChartComponent'
import Expenses from './pages/Expenses'
import Home from './pages/Home'
import DashboardPage from './pages/DashboardPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Navbar from './components/Navbar'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import { ProtectedRoute } from './routes/Guards'
import BudgetPage from './pages/BudgetPage'
import ThemeProvider from './components/ThemeProvider'
function App() {
  return (
    <>
      <ThemeProvider/>
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/profile' element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
        <Route path='/dashboard' element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
        <Route path='/expenses' element={<ProtectedRoute><Expenses/></ProtectedRoute>}/>
        <Route path='/chart' element={<ProtectedRoute><Chart/></ProtectedRoute>}/>
        <Route path='/login' element={<Login/>} />
        <Route path='/signup' element={<Signup/>} />
        <Route path='*' element={<NotFound/>} />
        <Route path='/budget' element={<ProtectedRoute><BudgetPage/></ProtectedRoute>}/>
      </Routes>
    </>
  )
}

export default App
