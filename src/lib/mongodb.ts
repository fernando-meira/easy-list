import mongoose, { Connection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Interface do cache com tipos bem definidos
interface Cached {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

// Tipo global que estende o objeto globalThis
type GlobalWithMongooseCache = typeof globalThis & {
  mongoose?: Cached;
};

// Acessa ou inicializa o cache no escopo global
const globalWithMongoose = global as GlobalWithMongooseCache;

const cached: Cached = globalWithMongoose.mongoose || { conn: null, promise: null };

async function connectDB(): Promise<Connection> {
  // Retorna a conexão existente, se disponível
  if (cached.conn) {
    return cached.conn;
  }

  // Se não houver uma promessa ativa, cria uma nova conexão
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      cached.conn = mongoose.connection;
      return mongoose.connection;
    });
  }

  // Aguarda a resolução da promessa e atualiza o cache
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
