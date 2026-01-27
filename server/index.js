import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const cors = require('cors');
app.use(cors({ origin: '*' })); // 允许所有来源，解决跨域问题
app.use(express.json());

// 数据库连接 (使用你之前成功的那个 URI)
const uri = "你的 MongoDB Atlas 连接字符串";
mongoose.connect("mongodb+srv://originxmc_db_user:XMCTestWeb@cluster0.knroewj.mongodb.net/?appName=Cluster0")
  .then(() => console.log('✅ MongoDB 已连接'))
  .catch(err => console.error('❌ 连接失败:', err));


// 必须这样写，优先读取 process.env.PORT
const PORT = process.env.PORT || 8080; 

// 重点：必须监听 '0.0.0.0'，否则外部网络无法访问
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// 定义计数器模型
const Counter = mongoose.model('Counter', { views: Number });

// 访问路由
// 修改 server/index.js 中的路由
app.get('/api/visit', async (req, res) => {
    try {
      // findOneAndUpdate 是原子操作，比先 find 再 save 更安全、更快
      const counter = await Counter.findOneAndUpdate(
        {}, // 匹配第一条记录
        { $inc: { views: 1 } }, // 原子递增 1
        { upsert: true, new: true } // 如果没记录就创建，返回更新后的结果
      );
      res.json({ views: counter.views });
    } catch (err) {
      console.error("数据库更新失败:", err);
      res.status(500).json({ error: 'Database Error' });
    }
  });

  // 1. 定义留言的数据模型
const Message = mongoose.model('Message', {
    username: String,
    content: String,
    likes: { type: Number, default: 0 }, //
    createdAt: { type: Date, default: Date.now }
  });
  
  // 2. 获取所有留言的接口 (按时间倒序)
  app.get('/api/messages', async (req, res) => {
    try {
      const messages = await Message.find().sort({ createdAt: -1 });
      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: "无法读取留言" });
    }
  });
  
  // 3. 提交新留言的接口
  app.post('/api/messages', express.json(), async (req, res) => {
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

  // 获取所有留言（按时间倒序排列）
app.get('/api/messages', async (req, res) => {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  });
  
  // 提交新留言
  app.post('/api/messages', async (req, res) => {
    try {
      const newMessage = new Message(req.body);
      await newMessage.save();
      res.json(newMessage);
    } catch (err) {
      res.status(500).json({ error: "留言保存失败" });
    }
  });

  // 删除特定留言的接口
app.delete('/api/messages/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await Message.findByIdAndDelete(id);
      res.json({ message: "删除成功" });
    } catch (err) {
      res.status(500).json({ error: "删除失败" });
    }
  });

  // 点赞接口：根据 ID 找到留言并增加点赞数
app.patch('/api/messages/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    // 使用 $inc 原子操作，防止多人同时点赞时数据错乱
    const updatedMessage = await Message.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } }, 
      { new: true, upsert: true } // new: true 返回更新后的数据
    );
    console.log("点赞成功，当前数据：", updatedMessage); // 在终端看一眼有没有加成功
    res.json(updatedMessage);
  } catch (err) {
    res.status(500).json({ error: "点赞失败" });
  }
});
  
app.listen(3001, () => {
  console.log('🚀 后端服务已启动：http://localhost:3001');
});