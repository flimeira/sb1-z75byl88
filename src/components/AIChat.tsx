import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Product {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  restaurant: {
    nome: string;
  };
}

interface Restaurant {
  id: string;
  nome: string;
  rating: number;
  deliverytime: string; // Changed from deliveryTime to deliverytime to match DB column
  delivery_fee: number;
  idtipo: string; // Changed from tipo to idtipo to match DB column
}

interface ChatSession {
  id: string;
  created_at: string;
}

export function AIChat({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [restaurantTypes, setRestaurantTypes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProducts();
    fetchRestaurantTypes().then(() => fetchRestaurants());
    if (user) {
      fetchOrCreateChatSession();
    } else {
      // Add initial greeting for non-authenticated users
      setMessages([{
        id: 'initial',
        role: 'assistant',
        content: 'Olá! Eu sou o assistente virtual do AmericanaFood. Como posso ajudar você hoje? Você pode me perguntar sobre pratos, preços, restaurantes ou fazer pedidos específicos como "quero uma pizza de mussarela", "qual o hambúrguer mais barato?" ou "qual restaurante tem entrega mais rápida?"'
      }]);
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchOrCreateChatSession = async () => {
    if (!supabase || !user) return;

    try {
      // Try to get the most recent session
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sessionsError) throw sessionsError;

      let sessionId: string;

      if (sessions && sessions.length > 0) {
        // Use existing session
        sessionId = sessions[0].id;
        setCurrentSession(sessionId);
        
        // Fetch messages for this session
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('id, role, content, created_at')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        if (messagesData && messagesData.length > 0) {
          setMessages(messagesData.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })));
        } else {
          // Add initial greeting if no messages in the session
          const initialMessage = {
            id: 'initial',
            role: 'assistant' as const,
            content: 'Olá! Eu sou o assistente virtual do AmericanaFood. Como posso ajudar você hoje? Você pode me perguntar sobre pratos, preços, restaurantes ou fazer pedidos específicos como "quero uma pizza de mussarela", "qual o hambúrguer mais barato?" ou "qual restaurante tem entrega mais rápida?"'
          };
          
          setMessages([initialMessage]);
          
          // Save initial greeting to database
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: initialMessage.role,
            content: initialMessage.content
          });
        }
      } else {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id
          })
          .select('id')
          .single();

        if (createError) throw createError;
        
        sessionId = newSession.id;
        setCurrentSession(sessionId);
        
        // Add initial greeting
        const initialMessage = {
          id: 'initial',
          role: 'assistant' as const,
          content: 'Olá! Eu sou o assistente virtual do AmericanaFood. Como posso ajudar você hoje? Você pode me perguntar sobre pratos, preços, restaurantes ou fazer pedidos específicos como "quero uma pizza de mussarela", "qual o hambúrguer mais barato?" ou "qual restaurante tem entrega mais rápida?"'
        };
        
        setMessages([initialMessage]);
        
        // Save initial greeting to database
        await supabase.from('chat_messages').insert({
          session_id: sessionId,
          role: initialMessage.role,
          content: initialMessage.content
        });
      }
    } catch (error) {
      console.error('Error fetching or creating chat session:', error);
      // Fallback to local-only chat
      setMessages([{
        id: 'initial',
        role: 'assistant',
        content: 'Olá! Eu sou o assistente virtual do AmericanaFood. Como posso ajudar você hoje? Você pode me perguntar sobre pratos, preços, restaurantes ou fazer pedidos específicos como "quero uma pizza de mussarela", "qual o hambúrguer mais barato?" ou "qual restaurante tem entrega mais rápida?"'
      }]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const createNewSession = async () => {
    if (!supabase || !user) return;
    setLoadingHistory(true);

    try {
      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id
        })
        .select('id')
        .single();

      if (createError) throw createError;
      
      setCurrentSession(newSession.id);
      
      // Add initial greeting
      const initialMessage = {
        id: 'initial',
        role: 'assistant' as const,
        content: 'Olá! Eu sou o assistente virtual do AmericanaFood. Como posso ajudar você hoje? Você pode me perguntar sobre pratos, preços, restaurantes ou fazer pedidos específicos como "quero uma pizza de mussarela", "qual o hambúrguer mais barato?" ou "qual restaurante tem entrega mais rápida?"'
      };
      
      setMessages([initialMessage]);
      
      // Save initial greeting to database
      await supabase.from('chat_messages').insert({
        session_id: newSession.id,
        role: initialMessage.role,
        content: initialMessage.content
      });
    } catch (error) {
      console.error('Error creating new chat session:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchRestaurantTypes = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('tipos')
        .select('id, tipo');

      if (error) throw error;
      
      const typesMap: Record<string, string> = {};
      if (data) {
        data.forEach(type => {
          typesMap[type.id] = type.tipo;
        });
      }
      
      setRestaurantTypes(typesMap);
      return typesMap;
    } catch (error) {
      console.error('Error fetching restaurant types:', error);
      return {};
    }
  };

  const fetchProducts = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        nome,
        descricao,
        valor,
        restaurant:idrestaurante (
          nome
        )
      `);

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    setProducts(data || []);
  };

  const fetchRestaurants = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id,
          nome,
          rating,
          deliverytime,
          delivery_fee,
          idtipo
        `);

      if (error) {
        console.error('Error fetching restaurants:', error);
        return;
      }

      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .trim();
  };

  const extractKeywords = (query: string): string[] => {
    const normalized = normalizeText(query);
    
    // Common words to filter out
    const stopWords = new Set([
      'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
      'e', 'ou', 'de', 'da', 'do', 'das', 'dos',
      'no', 'na', 'nos', 'nas', 'em', 'para', 'com',
      'por', 'que', 'se', 'quero', 'queria', 'gostaria',
      'tem', 'voce', 'voces', 'qual', 'quais', 'mais',
      'menos', 'barato', 'barata', 'caro', 'cara'
    ]);

    // Extract keywords
    return normalized
      .split(/\s+/)
      .filter(word => !stopWords.has(word) && word.length > 2);
  };

  const searchProducts = (query: string): Product[] => {
    const keywords = extractKeywords(query);
    if (keywords.length === 0) return [];

    return products.filter(product => {
      const searchText = normalizeText(`${product.nome} ${product.descricao}`);
      return keywords.some(keyword => searchText.includes(keyword));
    });
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const isRestaurantQuery = (query: string): boolean => {
    const normalizedQuery = normalizeText(query);
    const restaurantKeywords = [
      'restaurante', 'restaurantes', 'loja', 'lojas', 
      'estabelecimento', 'estabelecimentos', 'lugar', 'lugares',
      'entrega', 'delivery', 'taxa', 'frete', 'gratis', 'gratuita',
      'rapida', 'rapido', 'veloz', 'tempo', 'avaliacao', 'nota',
      'melhor', 'pior', 'rating', 'estrela', 'estrelas'
    ];
    
    return restaurantKeywords.some(keyword => normalizedQuery.includes(keyword)) ||
           normalizedQuery.includes('qual') || 
           normalizedQuery.includes('quais');
  };

  const getRestaurantWithFastestDelivery = (): Restaurant | null => {
    if (restaurants.length === 0) return null;
    
    return restaurants.reduce((fastest, current) => {
      const fastestTime = parseInt(fastest.deliverytime.split('-')[0]);
      const currentTime = parseInt(current.deliverytime.split('-')[0]);
      return currentTime < fastestTime ? current : fastest;
    });
  };

  const getRestaurantsWithFreeDelivery = (): Restaurant[] => {
    return restaurants.filter(restaurant => restaurant.delivery_fee === 0);
  };

  const getHighestRatedRestaurants = (): Restaurant[] => {
    if (restaurants.length === 0) return [];
    
    const maxRating = Math.max(...restaurants.map(r => r.rating));
    return restaurants.filter(r => r.rating === maxRating);
  };

  const formatRestaurantResponse = (query: string): string => {
    const normalizedQuery = normalizeText(query);
    
    // Check for fastest delivery query
    if (normalizedQuery.includes('rapida') || normalizedQuery.includes('rapido') || 
        normalizedQuery.includes('veloz') || 
        (normalizedQuery.includes('tempo') && normalizedQuery.includes('entrega'))) {
      const fastestRestaurant = getRestaurantWithFastestDelivery();
      if (fastestRestaurant) {
        return `O restaurante com entrega mais rápida é o ${fastestRestaurant.nome}, com tempo estimado de ${fastestRestaurant.deliverytime} minutos para entrega.`;
      }
    }
    
    // Check for free delivery query
    if (normalizedQuery.includes('gratis') || normalizedQuery.includes('gratuita') || 
        (normalizedQuery.includes('taxa') && normalizedQuery.includes('entrega') && 
         (normalizedQuery.includes('sem') || normalizedQuery.includes('zero') || normalizedQuery.includes('free')))) {
      const freeDeliveryRestaurants = getRestaurantsWithFreeDelivery();
      if (freeDeliveryRestaurants.length > 0) {
        if (freeDeliveryRestaurants.length === 1) {
          return `O ${freeDeliveryRestaurants[0].nome} é o único restaurante com entrega gratuita.`;
        } else {
          const restaurantNames = freeDeliveryRestaurants.map(r => r.nome).join(', ');
          return `Os restaurantes com entrega gratuita são: ${restaurantNames}.`;
        }
      } else {
        return "Não encontrei nenhum restaurante com entrega gratuita no momento.";
      }
    }
    
    // Check for best rated query
    if (normalizedQuery.includes('melhor') || normalizedQuery.includes('maior') || 
        normalizedQuery.includes('avaliacao') || normalizedQuery.includes('nota') || 
        normalizedQuery.includes('estrela') || normalizedQuery.includes('rating')) {
      const bestRatedRestaurants = getHighestRatedRestaurants();
      if (bestRatedRestaurants.length > 0) {
        if (bestRatedRestaurants.length === 1) {
          return `O restaurante mais bem avaliado é o ${bestRatedRestaurants[0].nome} com ${bestRatedRestaurants[0].rating} estrelas.`;
        } else {
          const restaurantNames = bestRatedRestaurants.map(r => `${r.nome} (${r.rating} estrelas)`).join(', ');
          return `Os restaurantes mais bem avaliados são: ${restaurantNames}.`;
        }
      }
    }
    
    // General restaurant information
    if (normalizedQuery.includes('restaurante') || normalizedQuery.includes('restaurantes')) {
      if (restaurants.length === 0) {
        return "Não encontrei informações sobre restaurantes no momento.";
      }
      
      let response = `Temos ${restaurants.length} restaurantes disponíveis:\n\n`;
      
      restaurants.forEach((restaurant, index) => {
        response += `${index + 1}. ${restaurant.nome}\n`;
        response += `⭐ ${restaurant.rating} estrelas\n`;
        response += `🕒 Entrega em ${restaurant.deliverytime} minutos\n`;
        response += `💰 Taxa de entrega: ${restaurant.delivery_fee === 0 ? 'Grátis' : formatCurrency(restaurant.delivery_fee)}\n`;
        response += `🍽️ Tipo: ${restaurantTypes[restaurant.idtipo] || 'Desconhecido'}\n\n`;
      });
      
      return response;
    }
    
    return "Desculpe, não entendi sua pergunta sobre restaurantes. Você pode perguntar sobre tempo de entrega, taxa de entrega ou avaliações dos restaurantes.";
  };

  const formatProductResponse = (query: string, matchingProducts: Product[]): string => {
    if (matchingProducts.length === 0) {
      return "Desculpe, não encontrei nenhum produto que corresponda ao seu pedido. Você pode tentar descrever de outra forma ou me perguntar sobre outros pratos disponíveis.";
    }

    const keywords = extractKeywords(query);
    const isSortByPrice = query.includes('barato') || query.includes('barata');
    
    if (isSortByPrice) {
      matchingProducts.sort((a, b) => a.valor - b.valor);
    }

    let response = '';
    
    if (query.toLowerCase().includes('mais barato') || query.toLowerCase().includes('mais barata')) {
      const cheapest = matchingProducts[0];
      response = `O ${cheapest.nome} mais barato que encontrei é do ${cheapest.restaurant.nome}, custando ${formatCurrency(cheapest.valor)}.\n\n`;
      response += `🍽️ ${cheapest.nome}\n`;
      response += `💰 ${formatCurrency(cheapest.valor)}\n`;
      response += `📍 ${cheapest.restaurant.nome}\n`;
      response += `ℹ️ ${cheapest.descricao}`;
      return response;
    }

    response = `Encontrei ${matchingProducts.length} ${matchingProducts.length === 1 ? 'opção' : 'opções'} para você:\n\n`;
    
    matchingProducts.forEach((product, index) => {
      response += `${index + 1}. ${product.nome}\n`;
      response += `💰 ${formatCurrency(product.valor)}\n`;
      response += `📍 ${product.restaurant.nome}\n`;
      response += `ℹ️ ${product.descricao}\n\n`;
    });

    response += "Posso ajudar você a escolher uma dessas opções ou buscar algo diferente!";
    return response;
  };

  const saveMessageToDatabase = async (message: Message) => {
    if (!supabase || !currentSession) return;

    try {
      await supabase.from('chat_messages').insert({
        session_id: currentSession,
        role: message.role,
        content: message.content
      });

      // Update session's updated_at timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentSession);
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Save user message to database
    if (user && currentSession) {
      saveMessageToDatabase(userMessage);
    }

    try {
      let response: string;
      
      // Determine if this is a restaurant-related query
      if (isRestaurantQuery(input)) {
        response = formatRestaurantResponse(input);
      } else {
        // Otherwise treat as a product query
        const matchingProducts = searchProducts(input);
        response = formatProductResponse(input, matchingProducts);
      }

      // Add AI response
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message to database
      if (user && currentSession) {
        saveMessageToDatabase(assistantMessage);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message to database
      if (user && currentSession) {
        saveMessageToDatabase(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingHistory) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg h-[600px] max-h-[90vh] flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Carregando conversa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-lg h-[600px] max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Assistente Virtual</h2>
          </div>
          <div className="flex items-center space-x-2">
            {user && (
              <>
                <button
                  onClick={createNewSession}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                  title="Nova conversa"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <span className="sr-only">Fechar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}