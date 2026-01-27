import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

// --- 中间件配置 ---
app.use(cors({
  origin: '*', // 允许前端跨域请求
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// --- 数据库连接 ---
// 优先读取环境变量中的 MONGO_URI
const mongoURI = process.env.MONGO_URI || "mongodb+srv://originxmc_db_user:XMCTestWeb@cluster0.knroewj.mongodb.net/?appName=Cluster0";

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB 已连接'))
  .catch(err => console.error('❌ 连接失败:', err));

// --- 数据模型 ---
const Counter = mongoose.model('Counter', { views: { type: Number, default: 0 } });
const Message = mongoose.model('Message', {
  username: String,
  content: String,
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// --- 路由接口 ---

// 访问量统计
app.get('/api/visit', async (req, res) => {
  try {
    const counter = await Counter.findOneAndUpdate(
      {},
      { $inc: { views: 1 } },
      { upsert: true, new: true }
    );
    res.json({ views: counter.views });
  } catch (err) {
    res.status(500).json({ error: 'Database Error' });
  }
});

// 获取留言
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "无法读取留言" });
  }
});

// 提交留言
app.post('/api/messages', async (req, res) => {
  try {
    const { username, content } = req.body;
    if (!username || !content) return res.status(400).json({ error: "内容不能为空" });
    const newMessage = new Message({ username, content });
    await newMessage.save();
    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ error: "留言保存失败" });
  }
});

// 点赞留言
app.patch('/api/messages/:id/like', async (req, res) => {
  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.json(updatedMessage);
  } catch (err) {
    res.status(500).json({ error: "点赞失败" });
  }
});

// 删除留言
app.delete('/api/messages/:id', async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: "删除成功" });
  } catch (err) {
    res.status(500).json({ error: "删除失败" });
  }
});

// --- 启动服务 ---
// ⚠️ 重要：Zeabur 环境下必须读取 process.env.PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});