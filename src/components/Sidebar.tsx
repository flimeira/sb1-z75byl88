import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, ShoppingBag, Award, MessageSquare, LogOut, Bot, Bell } from 'lucide-react';
import { AIChat } from './AIChat';
import { NotificationIcon } from './NotificationIcon';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onSignOut: () => void;
}

export function Sidebar({ isOpen, onClose, userEmail, onSignOut }: SidebarProps) {
  const navigate = useNavigate();
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <>
      {/* Overlay - apenas para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out
          md:translate-x-0 md:w-64 md:static md:h-screen
          ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80'}`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="text-lg font-semibold text-gray-900">Menu</div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full md:hidden"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="mb-8">
            <div className="text-sm text-gray-500">Logado como</div>
            <div className="text-gray-900 font-medium">{userEmail}</div>
          </div>

          <nav className="space-y-1 flex-1">
            <button
              onClick={() => {
                setShowAIChat(true);
                onClose();
              }}
              className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg group transition-colors"
            >
              <Bot className="w-5 h-5 mr-3 group-hover:text-blue-500" />
              <span>Assistente Virtual</span>
            </button>

            <button
              onClick={() => {
                navigate('/notifications');
                onClose();
              }}
              className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg group transition-colors"
            >
              <div className="relative mr-3">
                <Bell className="w-5 h-5 group-hover:text-blue-500" />
                <NotificationIcon />
              </div>
              <span>Notificações</span>
            </button>

            <button
              onClick={() => {
                navigate('/profile');
                onClose();
              }}
              className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg group transition-colors"
            >
              <User className="w-5 h-5 mr-3 group-hover:text-blue-500" />
              <span>Meu Perfil</span>
            </button>

            <button
              onClick={() => {
                navigate('/orders');
                onClose();
              }}
              className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg group transition-colors"
            >
              <ShoppingBag className="w-5 h-5 mr-3 group-hover:text-blue-500" />
              <span>Meus Pedidos</span>
            </button>

            <button
              onClick={() => {
                navigate('/points');
                onClose();
              }}
              className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg group transition-colors"
            >
              <Award className="w-5 h-5 mr-3 group-hover:text-blue-500" />
              <span>Programa de Pontos</span>
            </button>

            <button
              onClick={() => {
                navigate('/feedback');
                onClose();
              }}
              className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg group transition-colors"
            >
              <MessageSquare className="w-5 h-5 mr-3 group-hover:text-blue-500" />
              <span>Enviar Feedback</span>
            </button>
          </nav>

          <button
            onClick={onSignOut}
            className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg group transition-colors mt-auto"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChat onClose={() => setShowAIChat(false)} />
      )}
    </>
  );
}