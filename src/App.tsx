import Tables from './components/Table'
import './App.css'
import { ConfigProvider } from 'antd';

function App() {
 

  return (
    <div className='app'>
      <h1>جدول الرغبات</h1>
      <h3>hello</h3>
      <ConfigProvider direction='rtl'>
        <Tables />
      </ConfigProvider>
    </div>
  )
}

export default App
