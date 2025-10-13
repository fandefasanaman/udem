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
  const [activeTab, setActiveTab] = useState<'orders' | 'formations' | 'stats'>('orders');

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Administration</h2>
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 ${activeTab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Commandes
        </button>
        <button
          onClick={() => setActiveTab('formations')}
          className={`px-4 py-2 ${activeTab === 'formations' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Formations
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 ${activeTab === 'stats' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Statistiques
        </button>
      </div>

      {activeTab === 'orders' && <OrdersManagement />}
      {activeTab === 'formations' && <FormationsManagement />}
      {activeTab === 'stats' && <StatsManagement />}
    </div>
  );
}

function OrdersManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    const fetchOrders = async () => {
      let q;
      if (filter === 'pending') {
        q = query(
          collection(db, 'orders'),
          where('status', '==', 'pending'),
          orderBy('created_at', 'desc')
        );
      } else {
        q = query(
          collection(db, 'orders'),
          orderBy('created_at', 'desc')
        );
      }
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, [filter]);

  const handleValidate = async (orderId: string) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'validated',
      validated_at: new Date().toISOString()
    });
    setOrders(orders.filter(o => o.id !== orderId));
  };

  const handleReject = async (orderId: string) => {
    const reason = prompt('Raison du rejet:');
    if (reason) {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      });
      setOrders(orders.filter(o => o.id !== orderId));
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Gestion des Commandes</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            En attente
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Toutes
          </button>
        </div>
      </div>
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
                <span className={`px-3 py-1 rounded text-sm ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'validated' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status === 'pending' ? 'En attente' : order.status === 'validated' ? 'Validée' : 'Rejetée'}
                </span>
                <p className="text-2xl font-bold mt-2">{order.total_price.toLocaleString()} Ar</p>
                <p className="text-sm text-gray-600">{order.payment_method === 'mvola' ? 'MVola' : 'Orange Money'}</p>
              </div>
            </div>
            {order.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleValidate(order.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Valider
                </button>
                <button
                  onClick={() => handleReject(order.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Rejeter
                </button>
              </div>
            )}
            {order.status === 'rejected' && order.rejection_reason && (
              <p className="text-sm text-red-600 mt-2">Raison: {order.rejection_reason}</p>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="text-center text-gray-500">Aucune commande</p>}
      </div>
    </div>
  );
}

function FormationsManagement() {
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    description_long: '',
    price: 0,
    image_url: '',
    duration: '',
    level: 'beginner' as const,
    drive_file_id: '',
    syllabus: '',
    status: 'active' as const
  });

  useEffect(() => {
    fetchFormations();
  }, []);

  const fetchFormations = async () => {
    const snapshot = await getDocs(collection(db, 'formations'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFormations(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const syllabusArray = formData.syllabus.split('\n').filter(s => s.trim());

    if (editingId) {
      const formationRef = doc(db, 'formations', editingId);
      await updateDoc(formationRef, {
        ...formData,
        syllabus: syllabusArray,
        updated_at: new Date().toISOString()
      });
    } else {
      const { addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'formations'), {
        ...formData,
        syllabus: syllabusArray,
        sales_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    resetForm();
    fetchFormations();
  };

  const handleEdit = (formation: any) => {
    setEditingId(formation.id);
    setFormData({
      title: formation.title,
      category: formation.category,
      description: formation.description,
      description_long: formation.description_long,
      price: formation.price,
      image_url: formation.image_url,
      duration: formation.duration,
      level: formation.level,
      drive_file_id: formation.drive_file_id,
      syllabus: formation.syllabus.join('\n'),
      status: formation.status
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette formation?')) {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'formations', id));
      fetchFormations();
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      title: '',
      category: '',
      description: '',
      description_long: '',
      price: 0,
      image_url: '',
      duration: '',
      level: 'beginner',
      drive_file_id: '',
      syllabus: '',
      status: 'active'
    });
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Gestion des Formations</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isEditing ? 'Annuler' : 'Nouvelle Formation'}
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <h4 className="text-xl font-semibold">{editingId ? 'Modifier' : 'Ajouter'} une formation</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titre</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prix (Ar)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Durée</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="ex: 10 heures"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Niveau</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">URL Image</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">ID Fichier Google Drive</label>
              <input
                type="text"
                value={formData.drive_file_id}
                onChange={(e) => setFormData({ ...formData, drive_file_id: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description courte</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={2}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description longue</label>
              <textarea
                value={formData.description_long}
                onChange={(e) => setFormData({ ...formData, description_long: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Programme (une ligne par point)</label>
              <textarea
                value={formData.syllabus}
                onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={4}
                placeholder="Point 1&#10;Point 2&#10;Point 3"
                required
              />
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            {editingId ? 'Modifier' : 'Créer'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {formations.map(formation => (
          <div key={formation.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-xl font-semibold">{formation.title}</h4>
                <p className="text-sm text-gray-600">{formation.category} - {formation.level}</p>
                <p className="text-gray-600 mt-2">{formation.description}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-lg font-bold">{formation.price.toLocaleString()} Ar</span>
                  <span className="text-sm text-gray-600">{formation.duration}</span>
                  <span className={`text-sm ${formation.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {formation.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(formation)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(formation.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
        {formations.length === 0 && <p className="text-center text-gray-500">Aucune formation</p>}
      </div>
    </div>
  );
}

function StatsManagement() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    validatedOrders: 0,
    rejectedOrders: 0,
    totalRevenue: 0,
    totalFormations: 0,
    activeFormations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const formationsSnapshot = await getDocs(collection(db, 'formations'));

      const orders = ordersSnapshot.docs.map(doc => doc.data());
      const formations = formationsSnapshot.docs.map(doc => doc.data());

      const totalRevenue = orders
        .filter(o => o.status === 'validated')
        .reduce((sum, o) => sum + o.total_price, 0);

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        validatedOrders: orders.filter(o => o.status === 'validated').length,
        rejectedOrders: orders.filter(o => o.status === 'rejected').length,
        totalRevenue,
        totalFormations: formations.length,
        activeFormations: formations.filter(f => f.status === 'active').length
      });

      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6">Statistiques</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-600">Revenus Totaux</h4>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalRevenue.toLocaleString()} Ar</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-600">Commandes Totales</h4>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalOrders}</p>
          <div className="mt-4 text-sm space-y-1">
            <p className="text-yellow-600">En attente: {stats.pendingOrders}</p>
            <p className="text-green-600">Validées: {stats.validatedOrders}</p>
            <p className="text-red-600">Rejetées: {stats.rejectedOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-600">Formations</h4>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalFormations}</p>
          <p className="text-sm text-green-600 mt-2">Actives: {stats.activeFormations}</p>
        </div>
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
