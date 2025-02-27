import Tables from './components/Table'
import './App.css'
import { ConfigProvider } from 'antd';

function App() {
 

  return (
    <div className='app'>
      <h1>جدول الرغبات</h1>
      <ConfigProvider direction='rtl'>
        <Tables />
      </ConfigProvider>
    </div>
  )
}

export default App
