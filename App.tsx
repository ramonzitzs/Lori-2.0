
import React, { useState, useEffect, useRef } from 'react';
import { ConsumptionItem, ViewState } from './types';
import { INITIAL_ITEMS, AVAILABLE_ICONS } from './constants';
import DuoButton from './components/DuoButton';
import { getFunSummary } from './services/geminiService';

const SwipeableCard: React.FC<{
  item: ConsumptionItem;
  onTap: () => void;
  onDelete: (id: string) => void;
}> = ({ item, onTap, onDelete }) => {
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff < 0) {
      setOffsetX(Math.max(diff, -150));
    }
  };

  const handleTouchEnd = () => {
    if (offsetX < -100) {
      setIsDeleting(true);
      setTimeout(() => onDelete(item.id), 200);
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="swipe-delete-bg">
        <i className="fa-solid fa-trash-can text-white text-2xl"></i>
      </div>
      <div 
        style={{ transform: `translateX(${offsetX}px)`, transition: offsetX === 0 ? 'transform 0.2s' : 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => { if (offsetX === 0) onTap(); }}
        className={`duo-card relative z-10 flex items-center p-4 rounded-2xl cursor-pointer ${isDeleting ? 'opacity-0 scale-95' : 'opacity-100'} transition-all`}
      >
        <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl shadow-sm border-b-4 border-black/20`}>
          <i className={`fa-solid ${item.icon}`}></i>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="font-extrabold text-xl text-white">{item.name}</h3>
          <p className="text-[#8495a0] font-bold">R$ {item.price.toFixed(2)} / un</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-black text-[#58cc02]">{item.count}</span>
          <span className="text-xs font-bold text-[#8495a0] uppercase">R$ {(item.count * item.price).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [items, setItems] = useState<ConsumptionItem[]>(() => {
    const saved = localStorage.getItem('lori_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });
  
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedItem, setSelectedItem] = useState<ConsumptionItem | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState<string | null>(null);

  // New item form state
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newIconIndex, setNewIconIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem('lori_items', JSON.stringify(items));
  }, [items]);

  const increment = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, count: item.count + 1 } : item
    ));
    if (navigator.vibrate) navigator.vibrate(40);
  };

  const decrement = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, count: Math.max(0, item.count - 1) } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updatePrice = (id: string, price: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, price: price } : item
    ));
    setIsEditingPrice(null);
  };

  const handleAddNewItem = () => {
    if (!newName || !newPrice) return;
    const newItem: ConsumptionItem = {
      id: Date.now().toString(),
      name: newName,
      price: parseFloat(newPrice),
      count: 0,
      icon: AVAILABLE_ICONS[newIconIndex].icon,
      color: AVAILABLE_ICONS[newIconIndex].color,
      category: 'other'
    };
    setItems(prev => [...prev, newItem]);
    setNewName('');
    setNewPrice('');
    setView('dashboard');
  };

  const resetAll = () => {
    if (confirm('Deseja zerar toda a sua conta?')) {
      setItems(items.map(i => ({...i, count: 0})));
      setView('dashboard');
    }
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    setView('recap');
    const text = await getFunSummary(items);
    setSummary(text);
    setLoadingSummary(false);
  };

  const totalBill = items.reduce((acc, item) => acc + (item.count * item.price), 0);

  const renderDashboard = () => (
    <div className="flex flex-col gap-6 p-6 pb-36 min-h-screen bg-[#131f24]">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Lori</h1>
          <p className="text-[#8495a0] font-bold">Nunca perca a conta!</p>
        </div>
        <div className="bg-[#1cb0f6] text-white px-4 py-2 rounded-2xl shadow-md border-b-4 border-[#1899d6]">
           <span className="font-extrabold text-xl">R$ {totalBill.toFixed(2)}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {items.length === 0 ? (
          <div className="text-center py-20 opacity-50">
             <i className="fa-solid fa-ghost text-6xl mb-4 text-[#8495a0]"></i>
             <p className="font-bold text-[#8495a0]">Sua lista está vazia.<br/>Cadastre um item abaixo!</p>
          </div>
        ) : (
          items.map((item) => (
            <SwipeableCard 
              key={item.id} 
              item={item} 
              onTap={() => { setSelectedItem(item); setView('counter'); }}
              onDelete={deleteItem}
            />
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#131f24] border-t-2 border-[#37464f] flex gap-3 z-30">
        <DuoButton 
          className="flex-1" 
          onClick={handleGenerateSummary}
          color="bg-[#58cc02]"
          disabled={totalBill === 0}
        >
          <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
          Resumo
        </DuoButton>
        <DuoButton 
          onClick={() => setView('add-item')}
          color="bg-[#1cb0f6]"
          className="px-6"
        >
          <i className="fa-solid fa-plus text-xl"></i>
        </DuoButton>
        <DuoButton 
          onClick={resetAll}
          color="bg-[#ff4b4b]"
          className="px-6"
        >
          <i className="fa-solid fa-rotate-left"></i>
        </DuoButton>
      </div>
    </div>
  );

  const renderCounter = () => {
    if (!selectedItem) return null;
    const currentItem = items.find(i => i.id === selectedItem.id);
    if (!currentItem) {
      setView('dashboard');
      return null;
    }

    return (
      <div className="flex flex-col h-screen p-6 bg-[#131f24] text-white">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => setView('dashboard')}
            className="w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-b-4 border-[#37464f] text-[#8495a0]"
          >
            <i className="fa-solid fa-chevron-left text-xl"></i>
          </button>
          <h2 className="text-2xl font-black uppercase tracking-wide">Contador</h2>
          <button 
            onClick={() => setIsEditingPrice(currentItem.id)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-b-4 border-[#37464f] text-[#1cb0f6]"
          >
            <i className="fa-solid fa-pencil text-xl"></i>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-10">
          <div className={`${currentItem.color} w-44 h-44 rounded-[3rem] flex items-center justify-center text-white text-7xl shadow-xl border-b-8 border-black/20`}>
            <i className={`fa-solid ${currentItem.icon}`}></i>
          </div>

          <div className="text-center">
            <h1 className="text-5xl font-black mb-2">{currentItem.name}</h1>
            <p className="text-2xl font-bold text-[#8495a0]">R$ {currentItem.price.toFixed(2)} un</p>
          </div>

          <div className="flex items-center gap-8">
             <button 
              onClick={() => decrement(currentItem.id)}
              className="w-20 h-20 rounded-3xl border-2 border-b-8 border-[#37464f] flex items-center justify-center text-[#ff4b4b] active:border-b-2 active:translate-y-1 transition-all"
            >
              <i className="fa-solid fa-minus text-3xl"></i>
            </button>

            <div className="w-32 h-32 flex items-center justify-center">
              <span className="text-8xl font-black text-[#58cc02]">{currentItem.count}</span>
            </div>

            <button 
              onClick={() => increment(currentItem.id)}
              className="w-20 h-20 rounded-3xl bg-[#58cc02] border-b-8 border-[#46a302] flex items-center justify-center text-white active:border-b-2 active:translate-y-1 transition-all"
            >
              <i className="fa-solid fa-plus text-3xl"></i>
            </button>
          </div>

          <div className="bg-[#202f36] w-full p-6 rounded-3xl border-2 border-[#37464f]">
             <div className="flex justify-between items-center">
               <span className="text-xl font-bold text-[#8495a0]">Total:</span>
               <span className="text-3xl font-black text-[#1cb0f6]">R$ {(currentItem.count * currentItem.price).toFixed(2)}</span>
             </div>
          </div>
        </div>

        {isEditingPrice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-[#202f36] rounded-[2rem] p-8 w-full max-w-sm border-2 border-b-8 border-[#37464f]">
              <h3 className="text-2xl font-black mb-6 text-center">Ajustar Preço</h3>
              <div className="relative mb-8">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#8495a0]">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  autoFocus
                  defaultValue={currentItem.price}
                  id="price-input"
                  className="w-full pl-16 pr-4 py-4 rounded-2xl bg-[#131f24] border-2 border-[#37464f] text-2xl font-black text-white focus:border-[#1cb0f6] focus:outline-none"
                />
              </div>
              <div className="flex gap-4">
                <DuoButton className="flex-1" color="bg-[#4b4b4b]" onClick={() => setIsEditingPrice(null)}>Sair</DuoButton>
                <DuoButton className="flex-1" color="bg-[#1cb0f6]" onClick={() => {
                  const val = (document.getElementById('price-input') as HTMLInputElement).value;
                  updatePrice(currentItem.id, parseFloat(val));
                }}>Salvar</DuoButton>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAddItem = () => (
    <div className="flex flex-col h-screen p-6 bg-[#131f24] text-white animate-fade-in overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => setView('dashboard')}
          className="w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-b-4 border-[#37464f] text-[#8495a0]"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
        <h2 className="text-2xl font-black uppercase tracking-wide">Novo Item</h2>
        <div className="w-12"></div>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <label className="text-lg font-black text-[#8495a0] uppercase ml-1">O que é?</label>
          <input 
            type="text"
            placeholder="Ex: Chopp, Pizza..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-4 rounded-2xl bg-[#202f36] border-2 border-[#37464f] text-xl font-bold text-white focus:border-[#1cb0f6] outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-lg font-black text-[#8495a0] uppercase ml-1">Quanto custa?</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#8495a0]">R$</span>
            <input 
              type="number"
              placeholder="0,00"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full pl-12 pr-4 p-4 rounded-2xl bg-[#202f36] border-2 border-[#37464f] text-xl font-bold text-white focus:border-[#1cb0f6] outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-lg font-black text-[#8495a0] uppercase ml-1">Escolha um ícone</label>
          <div className="grid grid-cols-5 gap-3">
            {AVAILABLE_ICONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setNewIconIndex(idx)}
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl border-2 transition-all ${newIconIndex === idx ? 'border-[#1cb0f6] scale-110' : 'border-[#37464f] opacity-50'} ${item.color}`}
              >
                <i className={`fa-solid ${item.icon}`}></i>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 pb-4">
        <DuoButton 
          className="w-full py-4 text-xl" 
          onClick={handleAddNewItem}
          disabled={!newName || !newPrice}
          color="bg-[#58cc02]"
        >
          Cadastrar Produto
        </DuoButton>
      </div>
    </div>
  );

  const renderRecap = () => (
    <div className="flex flex-col min-h-screen p-6 bg-[#1cb0f6] text-white">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setView('dashboard')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/20 text-white">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
        <h2 className="text-2xl font-black uppercase tracking-wider">O Veredito</h2>
        <div className="w-12 h-12"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-8 relative">
           <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-2xl relative z-10">
              <i className="fa-solid fa-face-grin-stars text-8xl text-[#ffc800]"></i>
           </div>
           <div className="absolute -top-4 -right-4 bg-[#ff4b4b] text-white py-2 px-4 rounded-full font-black text-xl shadow-lg transform rotate-12 z-20">UAU!</div>
        </div>

        <div className="bg-[#202f36] rounded-3xl p-8 text-white shadow-xl relative w-full mb-8 border-2 border-[#37464f]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#202f36] rotate-45 border-l-2 border-t-2 border-[#37464f]"></div>
          {loadingSummary ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
              <p className="font-extrabold opacity-60">Consultando os oráculos...</p>
            </div>
          ) : (
            <p className="text-xl font-bold leading-relaxed italic">"{summary}"</p>
          )}
        </div>

        <div className="w-full bg-white/10 rounded-3xl p-6 mb-8 border border-white/20">
          <h3 className="text-lg font-black uppercase mb-4 opacity-80">Extrato da Diversão</h3>
          <div className="flex flex-col gap-3">
             {items.filter(i => i.count > 0).map(item => (
               <div key={item.id} className="flex justify-between items-center font-bold">
                 <span>{item.count}x {item.name}</span>
                 <span>R$ {(item.count * item.price).toFixed(2)}</span>
               </div>
             ))}
             <div className="h-px bg-white/20 my-2"></div>
             <div className="flex justify-between items-center text-2xl font-black">
                <span>TOTAL</span>
                <span>R$ {totalBill.toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>

      <DuoButton className="w-full py-4 text-xl" color="bg-[#58cc02]" onClick={() => setView('dashboard')}>
        Voltar para a Farra!
      </DuoButton>
    </div>
  );

  return (
    <main className="max-w-md mx-auto min-h-screen bg-[#131f24] text-white">
      {view === 'dashboard' && renderDashboard()}
      {view === 'counter' && renderCounter()}
      {view === 'recap' && renderRecap()}
      {view === 'add-item' && renderAddItem()}
    </main>
  );
};

export default App;
