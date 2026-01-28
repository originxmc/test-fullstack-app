import { useEffect, useState, useRef } from 'react'; // 1. 引入 useRef

// 定义留言的类型
interface IMessage {
  username: string;
  content: string;
  createdAt: string;
}
const API_BASE = "https://xmc-tpa.zeabur.app"; // 粘贴你刚才拿到的地址

function App() {
  const [count, setCount] = useState(0);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 获取数据的函数
 // 2. 修改 fetchAllData，在获取数据后滚动
const fetchAllData = async () => {
  try {
    // 同时获取访问量和留言列表
    const [visitRes, msgRes] = await Promise.all([
      fetch(`${API_BASE}/api/visit`),
      fetch(`${API_BASE}/api/messages`)
    ]);
    
    const visitData = await visitRes.json();
    const msgData = await msgRes.json();
    
    setCount(visitData.views);
    setMessages(msgData);
  } catch (err) {
    console.error("数据拉取失败:", err);
  }
  
  // 3. 这里的逻辑让它回到顶部看最新留言
  scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
};

  useEffect(() => {
    fetchAllData();
  }, []);

  const [isLoading, setIsLoading] = useState(false); // 新增加载状态

  // 删除留言的函数
  const deleteMessage = async (id: string) => {
    if (!window.confirm("确定要删除这条留言吗？")) return;
    
    await fetch(`${API_BASE}/api/messages/${id}`, {
      method: 'DELETE',
    });
    fetchAllData(); // 刷新列表
  };

  const likeMessage = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/messages/${id}/like`, {
        method: 'PATCH',
      });
      // 点赞成功后刷新列表显示最新数字
      fetchAllData(); 
    } catch (err) {
      console.error("点赞请求失败:", err);
    }
  };

  // 修改 handleSubmit 增加 loading 逻辑
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 简单的去空格校验
  if (!name.trim() || !text.trim()) {
    alert("请输入名字和内容哦！");
    return;
  }

  setIsLoading(true);
  try {
    await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, content: text })
    });
    setText(''); // 只清空内容，保留名字（方便连续留言）
    await fetchAllData();
  } catch (err) {
    alert("发送失败，请检查网络");
  } finally {
    setIsLoading(false);
  }
};

  return (
  <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
    {/* 1. 访问量展示 */}
    <div className="mb-10 text-center p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
      <h1 className="text-slate-400 text-sm uppercase tracking-widest mb-2">Total Visits</h1>
      <span className="text-5xl font-black text-cyan-400 font-mono">{count}</span>
    </div>

    {/* 留言墙主容器 */}
    <div className="w-full max-w-lg bg-slate-800 p-6 rounded-xl border border-slate-700">
      <h2 className="text-xl font-bold mb-6 text-cyan-400">Guestbook</h2>
      
      {/* 2. 输入表单 - 这里只会出现一次 */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <input 
          className="w-full bg-slate-900 border border-slate-700 p-3 rounded focus:border-cyan-500 outline-none transition"
          placeholder="Your Name" value={name} onChange={e => setName(e.target.value)}
        />
        <textarea 
          className="w-full bg-slate-900 border border-slate-700 p-3 rounded h-24 focus:border-cyan-500 outline-none transition"
          placeholder="Say something nice..." value={text} onChange={e => setText(e.target.value)}
        />
        <button 
          disabled={isLoading}
          className={`w-full py-3 rounded font-bold transition-all transform active:scale-95 ${
            isLoading ? 'bg-slate-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500'
          }`}
        >
          {isLoading ? 'Sending...' : 'Post Message'}
        </button>
      </form>

      {/* 3. 留言列表 - 只有一个 map 循环 */}
      <div ref={scrollRef} className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {messages.map((m: any) => (
          <div key={m._id} className="bg-slate-900 p-4 rounded-lg border-l-4 border-cyan-500 relative group">
            
            {/* 删除按钮 - 只有鼠标悬停在留言卡片上才会出现的 X */}
            <button 
              onClick={() => deleteMessage(m._id)} 
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
              title="Delete message"
            >
              ✕
            </button>

            <div className="flex justify-between items-center mb-2 pr-8">
              <span className="font-bold text-cyan-400">{m.username}</span>
              <span className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{m.content}</p>
            
            {/* 新增：点赞按钮区域 */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center">
      <button 
        onClick={() => likeMessage(m._id)}
        className="flex items-center space-x-2 text-slate-500 hover:text-pink-500 transition-colors group/like"
      >
        <svg xmlns="http://www.w3.org/2000/svg" 
             className="h-5 w-5 group-active/like:scale-125 transition-transform" 
             fill={m.likes > 0 ? "currentColor" : "none"} 
             viewBox="0 0 24 24" 
             stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="text-sm font-mono">{m.likes || 0}</span>
      </button>
    </div>
          </div>
        ))}
      </div>

    </div>
  </div>
);
}

export default App;