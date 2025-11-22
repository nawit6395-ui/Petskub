import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useMessages, useSendMessage } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { MessageCircle, SendHorizontal } from 'lucide-react';
import { alert } from '@/lib/alerts';

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationIdFromQuery = searchParams.get('conversationId');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationIdFromQuery);
  const { data: conversations, isLoading: conversationsLoading } = useConversations(user?.id);
  const activeConversation = conversations?.find((conv) => conv.id === activeConversationId) || conversations?.[0];
  const { data: messages, isLoading: messagesLoading } = useMessages(activeConversation?.id);
  const sendMessage = useSendMessage();
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (conversationIdFromQuery) {
      setActiveConversationId(conversationIdFromQuery);
    }
  }, [conversationIdFromQuery]);

  useEffect(() => {
    if (!activeConversationId && conversations && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !activeConversation) {
      alert.error('ไม่สามารถส่งข้อความได้');
      return;
    }

    sendMessage.mutate(
      {
        conversationId: activeConversation.id,
        senderId: user.id,
        content: messageInput,
      },
      {
        onSuccess: () => {
          setMessageInput('');
        },
      }
    );
  };

  const renderConversationList = () => {
    if (conversationsLoading) {
      return <p className="text-muted-foreground">กำลังโหลด...</p>;
    }

    if (!conversations || conversations.length === 0) {
      return (
        <div className="text-center text-muted-foreground">
          <p>ยังไม่มีการสนทนา</p>
          <p className="text-sm">เริ่มแชทจากการ์ดประกาศสัตว์เลี้ยงเพื่อคุยกับเจ้าของ</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {conversations.map((conversation) => {
          const catImage = Array.isArray(conversation.cat?.image_url) && conversation.cat?.image_url.length > 0
            ? conversation.cat.image_url[0]
            : '/placeholder.svg';
          const isActive = activeConversation?.id === conversation.id;

          const lastUpdated = conversation.last_message_at
            ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: th })
            : 'ยังไม่มีข้อความ';

          return (
            <button
              key={conversation.id}
              className={`w-full rounded-2xl border px-3 py-3 text-left transition hover:border-primary/60 ${isActive ? 'border-primary/50 bg-primary/10' : 'border-border'}`}
              onClick={() => setActiveConversationId(conversation.id)}
            >
              <div className="flex items-center gap-3">
                <img src={catImage} alt={conversation.cat?.name} className="h-12 w-12 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-semibold">{conversation.cat?.name || 'ไม่ทราบชื่อ'}</p>
                  <p className="text-xs text-muted-foreground">อัปเดต {lastUpdated}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderMessages = () => {
    if (!activeConversation) {
      return <p className="text-muted-foreground">เลือกบทสนทนาเพื่อเริ่มแชท</p>;
    }

    if (messagesLoading) {
      return <p className="text-muted-foreground">กำลังโหลดข้อความ...</p>;
    }

    if (!messages || messages.length === 0) {
      return <p className="text-muted-foreground">ยังไม่มีข้อความ เริ่มบทสนทนาเลย!</p>;
    }

    return (
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwner = message.sender_id === user?.id;
          return (
            <div key={message.id} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isOwner ? 'bg-primary text-white' : 'bg-muted'} `}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="mt-1 block text-[10px] opacity-70">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: th })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">กล่องข้อความ</h1>
          <p className="text-muted-foreground">พูดคุยกับเจ้าของหรือผู้รับเลี้ยงอย่างปลอดภัยในระบบ</p>
        </div>
        <Link to="/adopt">
          <Button variant="outline" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            ค้นหาสัตว์เลี้ยงเพิ่ม
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <Card className="p-4">
          <h2 className="mb-4 text-lg font-semibold">การสนทนาทั้งหมด</h2>
          {renderConversationList()}
        </Card>

        <Card className="flex h-[600px] flex-col p-4">
          {activeConversation ? (
            <>
              <div className="mb-4 flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">กำลังคุยเกี่ยวกับ</p>
                  <h2 className="text-xl font-semibold">{activeConversation.cat?.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    เจ้าของ: {activeConversation.owner?.full_name || 'ไม่ระบุ'}
                  </p>
                </div>
                <BadgeStatus status={activeConversation.status} />
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {renderMessages()}
              </div>

              <form onSubmit={handleSendMessage} className="mt-4 space-y-2">
                <Textarea
                  placeholder="พิมพ์ข้อความ..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  rows={3}
                  maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{messageInput.length}/1000</span>
                  <Button type="submit" disabled={sendMessage.isPending || !messageInput.trim()} className="gap-2">
                    <SendHorizontal className="h-4 w-4" />
                    ส่งข้อความ
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center text-muted-foreground">
              เลือกบทสนทนาเพื่อเริ่มต้น
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const BadgeStatus = ({ status }: { status: 'open' | 'closed' }) => {
  if (status === 'closed') {
    return <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">ปิดการสนทนา</span>;
  }
  return <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">เปิดอยู่</span>;
};

export default Chat;
