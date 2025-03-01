import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Feedback() {
  const navigate = useNavigate();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (rating === 0) {
      setError('Por favor, selecione uma classificação');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('feedbacks')
        .insert({
          user_id: user.id,
          rating,
          comment: comment.trim() || null
        });

      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Falha ao enviar feedback. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-green-500 fill-current" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Obrigado pelo seu feedback!</h2>
          <p className="text-gray-600 mb-6">
            Sua opinião é muito importante para continuarmos melhorando nossos serviços.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para o Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Avalie nossa plataforma</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Como você avalia sua experiência?
                </label>
                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoveredRating(value)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          value <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center mt-2 text-sm text-gray-600">
                  {rating > 0 && (
                    <span>Você selecionou {rating} {rating === 1 ? 'estrela' : 'estrelas'}</span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Conte-nos mais sobre sua experiência (opcional)
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="O que você mais gostou? O que podemos melhorar?"
                  className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-3"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar Feedback'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}