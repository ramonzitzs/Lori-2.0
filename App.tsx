
import React, { useState, useEffect } from 'react';
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
    <div className="relative overflow-hidden rounded-2xl mb-4 w-full">
      <div className="swipe-delete-bg">
        <i className="fa-solid fa-trash-can text-white text-2xl"></i>
      </div>
      <div 
        style={{ transform: `translateX(${offsetX}px)`, transition: offsetX === 0 ? 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => { if (offsetX === 0) onTap(); }}
        className={`duo-card relative z-10 flex items-center p-4 rounded-2xl cursor-pointer ${isDeleting ? 'opacity-0 scale-95' : 'opacity-100'} transition-all select-none w-full`}
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
    try {
      const saved = localStorage.getItem('lori_storage_v2');
      return saved ? JSON.parse(saved) : INITIAL_ITEMS;
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      return INITIAL_ITEMS;
    }
  });
  
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedItem, setSelectedItem] = useState<ConsumptionItem | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newIconIndex, setNewIconIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem('lori_storage_v2', JSON.stringify(items));
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
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updatePrice = (id: string, price: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, price: isNaN(price) ? 0 : price } : item
    ));
    setIsEditingPrice(null);
  };

  const handleAddNewItem = () => {
    if (!newName || !newPrice) return;
    const priceVal = parseFloat(newPrice.replace(',', '.'));
    const newItem: ConsumptionItem = {
      id: `item-${Date.now()}`,
      name: newName,
      price: isNaN(priceVal) ? 0 : priceVal,
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

  const resetAllCounts = () => {
    if (confirm('Deseja zerar o consumo de todos os itens?')) {
      setItems(prev => prev.map(i => ({...i, count: 0})));
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    setView('recap');
    try {
      const text = await getFunSummary(items);
      setSummary(text);
    } catch (e) {
      setSummary("Uau, que noite! Você realmente sabe aproveitar!");
    }
    setLoadingSummary(false);
  };

  const totalBill = items.reduce((acc, item) => acc + (item.count * item.price), 0);

  const renderDashboard = () => (
    <div className="flex flex-col gap-6 p-6 pb-36 min-h-screen bg-[#131f24] animate-in fade-in duration-500 w-full overflow-y-auto">
      <header className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-1">Lori</h1>
          <p className="text-[#8495a0] font-bold text-sm">Controle divertido de gastos.</p>
        </div>
        <div className="bg-[#1cb0f6] text-white px-5 py-3 rounded-2xl shadow-lg border-b-4 border-[#1899d6] flex flex-col items-end">
           <span className="text-[10px] font-black uppercase opacity-70 tracking-widest leading-none mb-1">Total</span>
           <span className="font-black text-2xl">R$ {totalBill.toFixed(2)}</span>
        </div>
      </header>

      <div className="flex-1 w-full">
        {items.length === 0 ? (
          <div className="text-center py-24 opacity-30 w-full">
             <i className="fa-solid fa-mug-hot text-7xl mb-6"></i>
             <p className="font-bold text-xl">Sua lista está vazia.<br/>Toque no "+" para criar!</p>
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

      <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 bg-[#131f24]/90 backdrop-blur-md border-t-2 border-[#37464f] flex gap-3 z-30">
        <DuoButton 
          className="flex-1" 
          onClick={handleGenerateSummary}
          color="bg-[#58cc02]"
          disabled={totalBill === 0}
        >
          <i className="fa-solid fa-wand-magic-sparkles mr-2 text-lg"></i>
          Resumo
        </DuoButton>
        <DuoButton 
          onClick={() => setView('add-item')}
          color="bg-[#1cb0f6]"
          className="px-6"
        >
          <i className="fa-solid fa-plus text-2xl"></i>
        </DuoButton>
        <DuoButton 
          onClick={resetAllCounts}
          color="bg-[#ff4b4b]"
          className="px-6"
        >
          <i className="fa-solid fa-rotate-left text-xl"></i>
        </DuoButton>
      </div>
    </div>
  );

  const renderCounter = () => {
    const currentItem = items.find(i => i.id === selectedItem?.id);
    if (!currentItem) return null;

    return (
      <div className="flex flex-col h-screen p-6 bg-[#131f24] text-white animate-in slide-in-from-right duration-300 w-full overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => setView('dashboard')}
            className="w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-b-4 border-[#37464f] text-[#8495a0] active:translate-y-1 active:border-b-0"
          >
            <i className="fa-solid fa-chevron-left text-xl"></i>
          </button>
          <h2 className="text-xl font-black uppercase tracking-widest text-[#8495a0]">Contador</h2>
          <button 
            onClick={() => setIsEditingPrice(currentItem.id)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-b-4 border-[#37464f] text-[#1cb0f6] active:translate-y-1 active:border-b-0"
          >
            <i className="fa-solid fa-pencil text-xl"></i>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-12 w-full">
          <div className={`${currentItem.color} w-48 h-48 rounded-[3.5rem] flex items-center justify-center text-white text-8xl shadow-2xl border-b-8 border-black/20`}>
            <i className={`fa-solid ${currentItem.icon}`}></i>
          </div>

          <div className="text-center">
            <h1 className="text-5xl font-black mb-2 tracking-tight">{currentItem.name}</h1>
            <p className="text-2xl font-bold text-[#8495a0]">R$ {currentItem.price.toFixed(2)} un</p>
          </div>

          <div className="flex items-center gap-10">
             <button 
              onClick={() => decrement(currentItem.id)}
              className="w-20 h-20 rounded-3xl border-2 border-b-8 border-[#37464f] flex items-center justify-center text-[#ff4b4b] active:border-b-2 active:translate-y-1 transition-all"
            >
              <i className="fa-solid fa-minus text-3xl"></i>
            </button>

            <div className="w-24 text-center">
              <span className="text-8xl font-black text-[#58cc02] tabular-nums">{currentItem.count}</span>
            </div>

            <button 
              onClick={() => increment(currentItem.id)}
              className="w-20 h-20 rounded-3xl bg-[#58cc02] border-b-8 border-[#46a302] flex items-center justify-center text-white active:border-b-2 active:translate-y-1 transition-all"
            >
              <i className="fa-solid fa-plus text-3xl"></i>
            </button>
          </div>

          <div className="bg-[#202f36] w-full p-6 rounded-3xl border-2 border-[#37464f] shadow-lg">
             <div className="flex justify-between items-center">
               <span className="text-xl font-bold text-[#8495a0] uppercase tracking-wider">Subtotal:</span>
               <span className="text-3xl font-black text-[#1cb0f6]">R$ {(currentItem.count * currentItem.price).toFixed(2)}</span>
             </div>
          </div>
        </div>

        {isEditingPrice && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-[#202f36] rounded-[2rem] p-8 w-full max-w-sm border-2 border-b-8 border-[#37464f] animate-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-black mb-6 text-center text-white">Novo Preço</h3>
              <div className="relative mb-8">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-[#8495a0]">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  autoFocus
                  defaultValue={currentItem.price}
                  id="price-input"
                  className="w-full pl-16 pr-5 py-5 rounded-2xl bg-[#131f24] border-2 border-[#37464f] text-3xl font-black text-white focus:border-[#1cb0f6] focus:outline-none"
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
    <div className="flex flex-col h-screen p-6 bg-[#131f24] text-white animate-in slide-in-from-bottom duration-300 overflow-y-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => setView('dashboard')}
          className="w-12 h-12 flex items-center justify-center rounded-2xl border-2 border-b-4 border-[#37464f] text-[#8495a0]"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
        <h2 className="text-2xl font-black uppercase tracking-tight">Cadastrar</h2>
        <div className="w-12"></div>
      </div>

      <div className="space-y-8 flex-1 w-full">
        <div className="space-y-2">
          <label className="text-sm font-black text-[#8495a0] uppercase ml-1 tracking-widest">O que você vai consumir?</label>
          <input 
            type="text"
            placeholder="Ex: Chopp, Drink, Pizza..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-5 rounded-2xl bg-[#202f36] border-2 border-[#37464f] text-xl font-bold text-white focus:border-[#1cb0f6] outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-[#8495a0] uppercase ml-1 tracking-widest">Preço Individual (R$)</label>
          <input 
            type="number"
            placeholder="0,00"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="w-full p-5 rounded-2xl bg-[#202f36] border-2 border-[#37464f] text-xl font-bold text-white focus:border-[#1cb0f6] outline-none"
          />
        </div>

        <div className="space-y-4 w-full">
          <label className="text-sm font-black text-[#8495a0] uppercase ml-1 tracking-widest">Escolha um Ícone</label>
          <div className="grid grid-cols-5 gap-4">
            {AVAILABLE_ICONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setNewIconIndex(idx)}
                className={`w-full aspect-square rounded-2xl flex items-center justify-center text-white text-2xl border-2 transition-all ${newIconIndex === idx ? 'border-[#1cb0f6] scale-110 shadow-lg' : 'border-[#37464f] opacity-40'} ${item.color}`}
              >
                <i className={`fa-solid ${item.icon}`}></i>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 pb-10 w-full">
        <DuoButton 
          className="w-full py-5 text-xl" 
          onClick={handleAddNewItem}
          disabled={!newName || !newPrice}
          color="bg-[#58cc02]"
        >
          Salvar Produto
        </DuoButton>
      </div>
    </div>
  );

  const renderRecap = () => (
    <div className="flex flex-col min-h-screen p-6 bg-[#1cb0f6] text-white animate-in fade-in duration-500 w-full overflow-y-auto">
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => setView('dashboard')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/20 text-white">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
        <h2 className="text-xl font-black uppercase tracking-widest">O Veredito</h2>
        <div className="w-12 h-12"></div>
      </div>

      <div className="flex-1 flex flex-col items-center w-full">
        <div className="mb-10 relative">
           <div className="w-48 h-48 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl border-b-8 border-gray-200">
              <i className="fa-solid fa-face-grin-stars text-8xl text-[#ffc800]"></i>
           </div>
           <div className="absolute -top-4 -right-6 bg-[#ff4b4b] text-white py-2 px-6 rounded-full font-black text-2xl shadow-lg transform rotate-12 uppercase border-b-4 border-black/20">Uau!</div>
        </div>

        <div className="bg-[#202f36] rounded-[2.5rem] p-8 text-white shadow-2xl relative w-full mb-10 border-2 border-b-8 border-[#37464f]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#202f36] rotate-45 border-l-2 border-t-2 border-[#37464f]"></div>
          {loadingSummary ? (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#1cb0f6] border-t-transparent"></div>
              <p className="font-black text-[#8495a0] uppercase tracking-widest text-xs">Consultando os oráculos...</p>
            </div>
          ) : (
            <p className="text-xl font-bold leading-relaxed italic text-center">"{summary}"</p>
          )}
        </div>

        <div className="w-full bg-black/20 rounded-[2rem] p-8 mb-10 border border-white/20">
          <h3 className="text-sm font-black uppercase mb-6 opacity-60 tracking-[0.3em] text-center">Resumo Final</h3>
          <div className="flex flex-col gap-4">
             {items.filter(i => i.count > 0).map(item => (
               <div key={item.id} className="flex justify-between items-center font-bold text-lg">
                 <span className="opacity-80">{item.count}x {item.name}</span>
                 <span className="font-black">R$ {(item.count * item.price).toFixed(2)}</span>
               </div>
             ))}
             <div className="h-px bg-white/20 my-4"></div>
             <div className="flex justify-between items-center text-3xl font-black">
                <span>TOTAL</span>
                <span className="text-[#ffc800]">R$ {totalBill.toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>

      <DuoButton className="w-full py-5 text-xl mb-10" color="bg-[#58cc02]" onClick={() => setView('dashboard')}>
        Continuar a Farra!
      </DuoButton>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#131f24] text-white flex-1 flex flex-col w-full overflow-hidden">
      {view === 'dashboard' && renderDashboard()}
      {view === 'counter' && renderCounter()}
      {view === 'recap' && renderRecap()}
      {view === 'add-item' && renderAddItem()}
    </main>
  );
};

export default App;
