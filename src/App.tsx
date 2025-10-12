import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { db } from './lib/firebase';
import { collection, getDocs, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';

function AppContent() {
  const { user, profile, loading, signIn, signUp, signOut, isAdmin } = useAuth();
  const [page, setPage] = useState('home');

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">FormaPro</h1>
          <nav className="flex gap-4">
            <button onClick={() => setPage('home')} className="text-gray-700 hover:text-blue-600">Catalogue</button>
            {user && <button onClick={() => setPage('orders')} className="text-gray-700 hover:text-blue-600">Mes Commandes</button>}
            {isAdmin && <button onClick={() => setPage('admin')} className="text-gray-700 hover:text-blue-600">Admin</button>}
            {user ? (
              <button onClick={() => signOut()} className="text-gray-700 hover:text-blue-600">Déconnexion</button>
            ) : (
              <button onClick={() => setPage('login')} className="text-gray-700 hover:text-blue-600">Connexion</button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {page === 'home' && <HomePage />}
        {page === 'login' && <LoginPage onSuccess={() => setPage('home')} onSignUp={() => setPage('signup')} signIn={signIn} />}
        {page === 'signup' && <SignUpPage onSuccess={() => setPage('home')} onLogin={() => setPage('login')} signUp={signUp} />}
        {page === 'orders' && user && <OrdersPage />}
        {page === 'admin' && isAdmin && <AdminPage />}
      </main>
    </div>
  );
}

function HomePage() {
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFormations = async () => {
      const q = query(collection(db, 'formations'), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFormations(data);
      setLoading(false);
    };
    fetchFormations();
  }, []);

  if (loading) return <div>Chargement des formations...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Catalogue de Formations</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {formations.map(formation => (
          <div key={formation.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-2">{formation.title}</h3>
            <p className="text-gray-600 mb-4">{formation.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{formation.price.toLocaleString()} Ar</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Ajouter au panier
              </button>
            </div>
          </div>
        ))}
        {formations.length === 0 && (
          <p className="col-span-3 text-center text-gray-500">Aucune formation disponible</p>
        )}
      </div>
    </div>
  );
}

function LoginPage({ onSuccess, onSignUp, signIn }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-3xl font-bold mb-6">Connexion</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Se connecter
        </button>
        <button type="button" onClick={onSignUp} className="w-full text-blue-600 hover:underline">
          Créer un compte
        </button>
      </form>
    </div>
  );
}

function SignUpPage({ onSuccess, onLogin, signUp }: any) {
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(formData.email, formData.password, formData.name, formData.phone);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-3xl font-bold mb-6">Inscription</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom complet</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Téléphone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mot de passe</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
            minLength={8}
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Créer mon compte
        </button>
        <button type="button" onClick={onLogin} className="w-full text-blue-600 hover:underline">
          Déjà un compte? Se connecter
        </button>
      </form>
    </div>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        const q = query(
          collection(db, 'orders'),
          where('user_id', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(data);
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (loading) return <div>Chargement des commandes...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Mes Commandes</h2>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Commande #{order.order_number}</h3>
                <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded text-sm ${
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'validated' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {order.status === 'pending' ? 'En attente' : order.status === 'validated' ? 'Validée' : 'Rejetée'}
              </span>
            </div>
            <p className="text-2xl font-bold">{order.total_price.toLocaleString()} Ar</p>
          </div>
        ))}
        {orders.length === 0 && <p className="text-center text-gray-500">Aucune commande</p>}
      </div>
    </div>
  );
}

function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const q = query(
        collection(db, 'orders'),
        where('status', '==', 'pending'),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const handleValidate = async (orderId: string) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'validated',
      validated_at: new Date().toISOString()
    });
    setOrders(orders.filter(o => o.id !== orderId));
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Administration - Commandes en attente</h2>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">#{order.order_number}</h3>
                <p className="text-sm">{order.customer_name} - {order.customer_email}</p>
                <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{order.total_price.toLocaleString()} Ar</p>
                <p className="text-sm text-gray-600">{order.payment_method === 'mvola' ? 'MVola' : 'Orange Money'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleValidate(order.id)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Valider
              </button>
              <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                Rejeter
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-center text-gray-500">Aucune commande en attente</p>}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
