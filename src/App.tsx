import { BrowserRouter } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <h1 className="text-4xl font-bold text-center py-8">Character Battle</h1>
        <p className="text-center text-muted-foreground">
          1시간마다 30자 프롬프트로 최강의 캐릭터를 만들어보세요
        </p>
      </div>
    </BrowserRouter>
  )
}

export default App
