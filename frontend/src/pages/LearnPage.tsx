import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Brain, 
  Loader2, 
  Lightbulb, 
  ClipboardList, 
  Bookmark, 
  MessageSquare, 
  Hash, 
  Settings, 
  Send,
  Zap,
  Folder,
  ArrowLeft,
  AlertTriangle,
  Layers,
  Code,
  Database,
  Cpu,
  Cloud,
  CheckCircle2,
  ChevronRight,
  Smartphone,
  Bot,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { TopicExplanation } from '../types';
import { ROUTES } from '../constants/routes';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import { addLearnedTopic } from '../services/statsService';

import { useExplainTopic, useFollowUpQuestion } from '../hooks/useAiHooks';
import { useCreateNote } from '../hooks/useNoteDocsHooks';
import { useToast } from '../components/ui/ToastProvider';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../lib/translations';

// MODULE CONFIGURATION & KEYWORDS FOR INSTANT CLIENT-SIDE SEGREGATION
export const MODULES = [
  {
    id: 'General',
    name: 'General / Common',
    nameHi: 'सामान्य / सामान्य',
    icon: Layers,
    color: 'from-blue-500 to-indigo-600',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    desc: 'Explore any technical topic without domain boundaries',
    descHi: 'डोमेन सीमाओं के बिना किसी भी तकनीकी विषय का अन्वेषण करें',
    placeholder: 'Enter any technical topic (e.g. Recursion, Docker, SQL Joins)...',
    placeholderHi: 'कोई भी तकनीकी विषय दर्ज करें (जैसे रिकर्शन, डॉकर, SQL जॉइन्स)...',
    sampleTopics: ['Recursion', 'REST APIs', 'React Hooks', 'SQL Joins', 'Docker']
  },
  {
    id: 'System Design & Architecture',
    name: 'System Design & Architecture',
    nameHi: 'सिस्टम डिज़ाइन और आर्किटेक्चर',
    icon: Cpu,
    color: 'from-purple-500 to-pink-600',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    desc: 'Scalability, Microservices, Caching, Proxies, and System Architecture',
    descHi: 'स्केलेबिलिटी, माइक्रोसर्विसेज, कैशिंग, प्रॉक्सी और सिस्टम आर्किटेक्चर',
    placeholder: 'Enter System Design topic (e.g. Load Balancers, Microservices, Caching)...',
    placeholderHi: 'सिस्टम डिज़ाइन विषय दर्ज करें (जैसे लोड बैलेंसर्स, माइक्रोसर्विसेज, कैशिंग)...',
    sampleTopics: ['Load Balancers', 'Microservices', 'Caching Strategies', 'CAP Theorem', 'Consistent Hashing']
  },
  {
    id: 'Data Structures & Algorithms',
    name: 'Data Structures & Algorithms',
    nameHi: 'डेटा स्ट्रक्चर्स और एल्गोरिदम',
    icon: Brain,
    color: 'from-emerald-500 to-teal-600',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    desc: 'Arrays, Trees, Graphs, Dynamic Programming, and Sorting Algorithms',
    descHi: 'एरे, ट्री, ग्राफ, डायनामिक प्रोग्रामिंग और सॉर्टिंग एल्गोरिदम',
    placeholder: 'Enter DSA topic (e.g. Binary Search, Dynamic Programming, Graphs)...',
    placeholderHi: 'DSA विषय दर्ज करें (जैसे बाइनरी सर्च, डायनामिक प्रोग्रामिंग, ग्राफ)...',
    sampleTopics: ['Binary Search', 'Dynamic Programming', 'Dijkstra Algorithm', 'AVL Trees', 'Quick Sort']
  },
  {
    id: 'Web Development',
    name: 'Web Development',
    nameHi: 'वेब डेवलपमेंट',
    icon: Code,
    color: 'from-amber-500 to-orange-600',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    desc: 'React, Next.js, TypeScript, HTML/CSS, Backend APIs, and Web Vitals',
    descHi: 'रिएक्ट, नेक्स्ट.जेएस, टाइपस्क्रिप्ट, HTML/CSS, बैकएंड API और वेब वाइटल्स',
    placeholder: 'Enter Web Dev topic (e.g. React Hooks, Virtual DOM, CSS Flexbox)...',
    placeholderHi: 'वेब देव विषय दर्ज करें (जैसे रिएक्ट हुक्स, वर्चुअल DOM, CSS फ्लेक्सबॉक्स)...',
    sampleTopics: ['React Hooks', 'Virtual DOM', 'CSS Flexbox', 'CORS Security', 'Service Workers']
  },
  {
    id: 'Database Management',
    name: 'Database Management',
    nameHi: 'डेटाबेस प्रबंधन',
    icon: Database,
    color: 'from-cyan-500 to-blue-600',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    desc: 'SQL, NoSQL, Indexing, Sharding, Transactions, and ACID properties',
    descHi: 'SQL, NoSQL, इंडेक्सिंग, शार्डिंग, लेनदेन और ACID गुण',
    placeholder: 'Enter Database topic (e.g. SQL Joins, B-Tree Indexing, ACID Properties)...',
    placeholderHi: 'डेटाबेस विषय दर्ज करें (जैसे SQL जॉइन्स, B-Tree इंडेक्सिंग, ACID गुण)...',
    sampleTopics: ['SQL Joins', 'B-Tree Indexing', 'ACID Properties', 'Database Sharding', 'MongoDB vs PostgreSQL']
  },
  {
    id: 'DevOps & Cloud',
    name: 'DevOps & Cloud',
    nameHi: 'डेवऑप्स और क्लाउड',
    icon: Cloud,
    color: 'from-rose-500 to-red-600',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    desc: 'Docker, Kubernetes, AWS, CI/CD pipelines, Terraform, and Linux',
    descHi: 'डॉकर, कुबेरनेट्स, AWS, CI/CD पाइपलाइन्स, टेराफॉर्म और लिनक्स',
    placeholder: 'Enter DevOps topic (e.g. Docker Containers, Kubernetes Pods, CI/CD)...',
    placeholderHi: 'डेवऑप्स विषय दर्ज करें (जैसे डॉकर कंटेनर्स, कुबेरनेट्स पॉड्स, CI/CD)...',
    sampleTopics: ['Docker Containers', 'Kubernetes Pods', 'CI/CD Pipelines', 'AWS Lambda', 'Terraform Basics']
  },
  {
    id: 'Mobile App Development',
    name: 'Mobile App Development',
    nameHi: 'मोबाइल ऐप डेवलपमेंट',
    icon: Smartphone,
    color: 'from-violet-500 to-purple-600',
    badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    desc: 'React Native, Flutter, iOS Swift, Android Kotlin, and Mobile UI',
    descHi: 'रिएक्ट नेटिव, फ्लटर, iOS स्विफ्ट, एंड्रॉइड कोटलिन और मोबाइल UI',
    placeholder: 'Enter Mobile Dev topic (e.g. Flutter Widgets, React Native Navigation)...',
    placeholderHi: 'मोबाइल देव विषय दर्ज करें (जैसे फ्लटर विजेट्स, रिएक्ट नेटिव नेविगेशन)...',
    sampleTopics: ['Flutter Widgets', 'React Native Bridge', 'State Management', 'App Lifecycle', 'Push Notifications']
  },
  {
    id: 'Artificial Intelligence & ML',
    name: 'Artificial Intelligence & ML',
    nameHi: 'आर्टिफिशियल इंटेलिजेंस और ML',
    icon: Bot,
    color: 'from-fuchsia-500 to-pink-600',
    badgeColor: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
    desc: 'Machine Learning, Deep Learning, NLP, LLMs, Neural Networks, and PyTorch',
    descHi: 'मशीन लर्निंग, डीप लर्निंग, NLP, LLMs, न्यूरल नेटवर्क्स और पायटॉर्च',
    placeholder: 'Enter AI/ML topic (e.g. Neural Networks, LLM Architecture, Backpropagation)...',
    placeholderHi: 'AI/ML विषय दर्ज करें (जैसे न्यूरल नेटवर्क्स, LLM आर्किटेक्चर, बैकप्रोपेगेशन)...',
    sampleTopics: ['Neural Networks', 'LLM Architecture', 'Backpropagation', 'Gradient Descent', 'Transformers']
  },
  {
    id: 'Cybersecurity & Cryptography',
    name: 'Cybersecurity & Cryptography',
    nameHi: 'साइबर सुरक्षा और क्रिप्टोग्राफी',
    icon: ShieldCheck,
    color: 'from-emerald-600 to-green-700',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    desc: 'Encryption, OWASP Top 10, Firewalls, Penetration Testing, and Hashing',
    descHi: 'एन्क्रिप्शन, OWASP टॉप 10, फायरवॉल, पेनेट्रेशन टेस्टिंग और हैशिंग',
    placeholder: 'Enter Security topic (e.g. OWASP Top 10, Asymmetric Encryption, SQL Injection)...',
    placeholderHi: 'सुरक्षा विषय दर्ज करें (जैसे OWASP टॉप 10, असममित एन्क्रिप्शन, SQL इंजेक्शन)...',
    sampleTopics: ['OWASP Top 10', 'Asymmetric Encryption', 'SQL Injection', 'Cross-Site Scripting', 'OAuth 2.0 Security']
  },
  {
    id: 'Operating Systems & Linux',
    name: 'Operating Systems & Linux',
    nameHi: 'ऑपरेटिंग सिस्टम और लिनक्स',
    icon: Terminal,
    color: 'from-sky-500 to-blue-600',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    desc: 'Processes, Threads, Memory Management, Deadlocks, Linux Kernel, and Bash',
    descHi: 'प्रक्रियाएं, थ्रेड्स, मेमोरी प्रबंधन, डेडलॉक, लिनक्स कर्नेल और बैश',
    placeholder: 'Enter OS topic (e.g. Virtual Memory, Process vs Thread, Deadlocks)...',
    placeholderHi: 'OS विषय दर्ज करें (जैसे वर्चुअल मेमोरी, प्रोसेस बनाम थ्रेड, डेडलॉक)...',
    sampleTopics: ['Virtual Memory', 'Process vs Thread', 'Deadlocks', 'Mutex vs Semaphore', 'Linux File Permissions']
  }
];

const MODULE_KEYWORDS: Record<string, string[]> = {
  'System Design & Architecture': [
    'system design', 'scalability', 'microservices', 'monolith', 'load balancer', 'caching', 'redis', 'memcached', 
    'cdn', 'proxy', 'reverse proxy', 'api gateway', 'cap theorem', 'pacelc', 'consistent hashing', 'sharding', 
    'partitioning', 'heartbeat', 'gossip protocol', 'rate limiting', 'token bucket', 'leaky bucket', 'saga pattern', 
    'cqrs', 'event sourcing', 'message queue', 'kafka', 'rabbitmq', 'pubsub', 'pub/sub', 'zookeeper', 'etcd', 
    'service discovery', 'circuit breaker', 'distributed', 'throughput', 'latency', 'redundancy', 'failover', 'dns'
  ],
  'Data Structures & Algorithms': [
    'array', 'linked list', 'stack', 'queue', 'tree', 'binary tree', 'bst', 'avl', 'red black', 'trie', 'heap', 
    'hash table', 'hashmap', 'graph', 'bfs', 'dfs', 'dijkstra', 'bellman ford', 'floyd warshall', 'kruskal', 'prim', 
    'topological sort', 'dynamic programming', 'dp', 'memoization', 'tabulation', 'greedy', 'backtracking', 'recursion', 
    'sorting', 'quicksort', 'mergesort', 'heapsort', 'bubble sort', 'insertion sort', 'selection sort', 'binary search', 
    'two pointer', 'sliding window', 'bit manipulation', 'time complexity', 'space complexity', 'big o', 'asymptotic'
  ],
  'Web Development': [
    'html', 'css', 'javascript', 'js', 'typescript', 'ts', 'react', 'vue', 'angular', 'svelte', 'nextjs', 'next.js', 
    'nuxtjs', 'remix', 'dom', 'virtual dom', 'css flexbox', 'flexbox', 'css grid', 'tailwind', 'bootstrap', 'sass', 
    'less', 'webpack', 'vite', 'babel', 'frontend', 'backend', 'nodejs', 'node.js', 'express', 'nestjs', 'rest api', 
    'graphql', 'grpc', 'websocket', 'webrtc', 'cors', 'csrf', 'xss', 'jwt', 'oauth', 'session', 'cookie', 'localstorage', 
    'service worker', 'pwa', 'responsive design', 'web vitals', 'seo', 'accessibility', 'a11y', 'spa', 'ssr', 'ssg', 'csr'
  ],
  'Database Management': [
    'sql', 'nosql', 'database', 'dbms', 'rdbms', 'mysql', 'postgresql', 'postgres', 'oracle', 'sql server', 'sqlite', 
    'mongodb', 'mongo', 'cassandra', 'dynamodb', 'couchbase', 'neo4j', 'redis', 'elasticsearch', 'acid', 'base properties', 
    'transaction', 'isolation level', 'normalization', '1nf', '2nf', '3nf', 'bclnf', 'denormalization', 'indexing', 
    'b-tree', 'b+ tree', 'bitmap index', 'foreign key', 'primary key', 'composite key', 'join', 'inner join', 'left join', 
    'outer join', 'query optimization', 'execution plan', 'vacuum', 'wal', 'write ahead log', 'stored procedure', 'trigger'
  ],
  'DevOps & Cloud': [
    'devops', 'cloud', 'aws', 'azure', 'gcp', 'google cloud', 'docker', 'container', 'kubernetes', 'k8s', 'helm', 
    'ci/cd', 'continuous integration', 'continuous deployment', 'jenkins', 'github actions', 'gitlab ci', 'circleci', 
    'terraform', 'cloudformation', 'ansible', 'puppet', 'chef', 'infrastructure as code', 'iac', 'linux', 'bash', 
    'shell scripting', 'ubuntu', 'centos', 'nginx', 'apache', 'monitoring', 'observability', 'prometheus', 'grafana', 
    'elk', 'datadog', 'new relic', 'pagerduty', 'sre', 'site reliability', 'slis', 'slos', 'slas', 'serverless', 'lambda', 
    'ec2', 's3', 'vpc', 'iam', 'ecs', 'eks', 'fargate', 'cloudwatch'
  ],
  'Mobile App Development': [
    'mobile', 'ios', 'android', 'react native', 'flutter', 'dart', 'swift', 'kotlin', 'xamarin', 'ionic', 
    'cordova', 'mobile ui', 'app lifecycle', 'push notifications', 'apk', 'ipa', 'biometrics', 'mobile bridge',
    'cocoapods', 'gradle', 'jetpack compose', 'swiftui', 'state management', 'mobile navigation'
  ],
  'Artificial Intelligence & ML': [
    'ai', 'ml', 'artificial intelligence', 'machine learning', 'deep learning', 'nlp', 'natural language processing',
    'llm', 'large language model', 'neural network', 'pytorch', 'tensorflow', 'keras', 'scikit-learn', 'backpropagation',
    'gradient descent', 'transformer', 'attention mechanism', 'bert', 'gpt', 'fine tuning', 'rag', 'vector database',
    'embeddings', 'supervised learning', 'unsupervised learning', 'reinforcement learning', 'cnn', 'rnn', 'lstm'
  ],
  'Cybersecurity & Cryptography': [
    'security', 'cybersecurity', 'cryptography', 'encryption', 'decryption', 'owasp', 'firewall', 'penetration testing',
    'hashing', 'ssl', 'tls', 'https', 'sql injection', 'xss', 'csrf', 'ssrf', 'man in the middle', 'mitm', 'phishing',
    'malware', 'ransomware', 'asymmetric encryption', 'symmetric encryption', 'rsa', 'aes', 'sha-256', 'salting',
    'zero trust', 'iam security', 'rate limiting security'
  ],
  'Operating Systems & Linux': [
    'operating system', 'os', 'linux', 'ubuntu', 'kernel', 'process', 'thread', 'memory management', 'virtual memory',
    'paging', 'segmentation', 'deadlock', 'mutex', 'semaphore', 'concurrency', 'scheduler', 'context switch',
    'file system', 'inode', 'bash', 'shell', 'cli', 'system call', 'fork', 'exec', 'interprocess communication',
    'ipc', 'pipes', 'shared memory', 'daemons'
  ]
};
function checkModuleMismatch(topic: string, currentModule: string): { isMismatch: boolean; suggestedModule?: string } {
  if (!topic || !currentModule || currentModule === 'General' || currentModule === 'Common') {
    return { isMismatch: false };
  }

  const normalized = topic.toLowerCase().trim();
  const currentKeywords = MODULE_KEYWORDS[currentModule] || [];
  const matchesCurrent = currentKeywords.some(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(normalized) || kw === normalized || normalized.includes(kw);
  });

  if (matchesCurrent) {
    return { isMismatch: false };
  }

  for (const [modId, keywords] of Object.entries(MODULE_KEYWORDS)) {
    if (modId !== currentModule) {
      const matchesOther = keywords.some(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(normalized) || kw === normalized || normalized.includes(kw);
      });
      if (matchesOther) {
        return { isMismatch: true, suggestedModule: modId };
      }
    }
  }

  return { isMismatch: false };
}

const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const renderFormattedParagraph = (paragraph: string, idx: number) => {
  const text = paragraph.trim();
  if (text.startsWith('### ')) {
    return (
      <h3 key={idx} className="text-white font-bold text-xl mt-6 mb-3 tracking-tight border-b border-border/40 pb-2">
        {text.replace(/^###\s+/, '')}
      </h3>
    );
  }
  if (text.startsWith('## ')) {
    return (
      <h2 key={idx} className="text-white font-bold text-2xl mt-8 mb-4 tracking-tight border-b border-border/40 pb-2">
        {text.replace(/^##\s+/, '')}
      </h2>
    );
  }
  if (text.startsWith('# ')) {
    return (
      <h1 key={idx} className="text-white font-bold text-3xl mt-8 mb-4 tracking-tight border-b border-border/40 pb-2">
        {text.replace(/^#\s+/, '')}
      </h1>
    );
  }
  if (text.startsWith('- ') || text.startsWith('* ')) {
    return (
      <div key={idx} className="flex items-start gap-2.5 my-2 pl-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
        <p className="text-text-secondary text-[15px] leading-relaxed">
          {renderBoldText(text.replace(/^[-*]\s+/, ''))}
        </p>
      </div>
    );
  }
  if (/^\d+\.\s+/.test(text)) {
    const match = text.match(/^(\d+\.\s+)(.*)/);
    return (
      <div key={idx} className="flex items-start gap-2 my-2 pl-1">
        <span className="text-primary font-bold text-[15px] min-w-[20px]">{match?.[1]}</span>
        <p className="text-text-secondary text-[15px] leading-relaxed">
          {renderBoldText(match?.[2] || text)}
        </p>
      </div>
    );
  }
  return (
    <p key={idx} className="text-text-secondary text-[15px] leading-relaxed my-3 font-medium">
      {renderBoldText(text)}
    </p>
  );
};

const LearnPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as { topic?: string, initialTopic?: string };
  const [topic, setTopic] = useState('');
  const { language } = useLanguage();
  const t = translations[language].learn;
  const [explanation, setExplanation] = useState<TopicExplanation | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [followUp, setFollowUp] = useState('');
  
  // MODULE & MISMATCH STATES
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [mismatchError, setMismatchError] = useState<{ topic: string; currentModule: string; suggestedModule: string } | null>(null);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const explainMutation = useExplainTopic();
  const followUpMutation = useFollowUpQuestion();
  const createNoteMutation = useCreateNote();

  const handleExplain = () => {
    if (!topic.trim() || explainMutation.isPending) return;

    setMismatchError(null);
    const currentMod = activeModule || 'General';
    const mismatchCheck = checkModuleMismatch(topic, currentMod);

    if (mismatchCheck.isMismatch && mismatchCheck.suggestedModule) {
      setMismatchError({
        topic,
        currentModule: currentMod,
        suggestedModule: mismatchCheck.suggestedModule
      });
      setExplanation(null);
      showToast(language === 'en' ? 'Topic mismatch detected' : 'विषय बेमेल पाया गया', 'warning');
      return;
    }

    explainMutation.mutate({ topic, language, module: currentMod }, {
      onSuccess: (data: any) => {
        setExplanation(data);
        if (!data.isUnrelatedModule) {
          addLearnedTopic(data.topic);
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          showToast(`Explained: ${data.topic}`, 'success');
        } else {
          showToast(language === 'en' ? 'Topic mismatch detected' : 'विषय बेमेल पाया गया', 'warning');
        }
      },
      onError: (error: any) => {
        showToast(error.message || 'Failed to explain topic', 'error');
      }
    });
  };

  // Handle topic passed from Dashboard or search box
  useEffect(() => {
    const passedTopic = state?.topic || state?.initialTopic;
    if (passedTopic && passedTopic !== topic && !explainMutation.isPending) {
      setTopic(passedTopic);
      setCharCount(passedTopic.length);
      setExplanation(null);
      setMismatchError(null);
      
      const currentMod = activeModule || 'General';
      if (!activeModule) {
        setActiveModule('General');
      }
      
      const mismatchCheck = checkModuleMismatch(passedTopic, currentMod);
      if (mismatchCheck.isMismatch && mismatchCheck.suggestedModule) {
        setMismatchError({
          topic: passedTopic,
          currentModule: currentMod,
          suggestedModule: mismatchCheck.suggestedModule
        });
        showToast(language === 'en' ? 'Topic mismatch detected' : 'विषय बेमेल पाया गया', 'warning');
        return;
      }
      
      explainMutation.mutate({ topic: passedTopic, language, module: currentMod }, {
        onSuccess: (data: any) => {
          setExplanation(data);
          if (!data.isUnrelatedModule) {
            addLearnedTopic(data.topic);
            queryClient.invalidateQueries({ queryKey: ['stats'] });
          }
        }
      });
    }
  }, [state?.topic, state?.initialTopic, topic, explainMutation.isPending, language, queryClient, activeModule]);

  // Re-trigger explanation when language changes
  useEffect(() => {
    if (explanation) {
      explainMutation.mutate({ topic: explanation.topic, language, module: activeModule || 'General' }, {
        onSuccess: (data: any) => setExplanation(data)
      });
    }
  }, [language]);

  const handleSaveNotes = () => {
    if (!explanation) return;
    
    createNoteMutation.mutate({
      title: explanation.topic,
      content: typeof explanation.explanation === 'object' 
        ? Object.values(explanation.explanation).join('\n\n') 
        : explanation.explanation,
      topic: explanation.topic,
      isAI: true
    }, {
      onSuccess: () => {
        showToast('Notes saved successfully', 'success');
      }
    });
  };

  const handleFollowUp = () => {
    if (!followUp.trim() || !explanation || followUpMutation.isPending) return;
    
    followUpMutation.mutate({
      topic: explanation.topic,
      currentExplanation: typeof explanation.explanation === 'object' 
        ? Object.values(explanation.explanation).join('\n\n') 
        : explanation.explanation,
      question: followUp,
      language
    }, {
      onSuccess: (data: any) => {
        setExplanation(prev => {
          if (!prev) return prev;
          
          const currentExpl = typeof prev.explanation === 'object' 
            ? Object.values(prev.explanation).join('\n\n') 
            : prev.explanation;
            
          return {
            ...prev,
            explanation: currentExpl + `\n\n---\n\n**Follow-up Question:** ${followUp}\n\n**Answer:** ${data.answer}`,
            codeExample: data.codeExample || prev.codeExample,
            realLifeExample: data.realLifeExample || prev.realLifeExample
          };
        });
        setFollowUp('');
        showToast('Follow-up answered!', 'success');
      }
    });
  };

  const currentModConfig = MODULES.find(m => m.id === activeModule) || MODULES[0];
  const activePlaceholder = language === 'en' ? currentModConfig.placeholder : currentModConfig.placeholderHi;
  const activeSampleTopics = currentModConfig.sampleTopics;
  const isUnrelatedAI = explanation && (explanation as any).isUnrelatedModule;

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E]">
      {/* TOPBAR AREA */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-border/40 bg-[#0A0F1E]/80 backdrop-blur-md">
        <h1 className="text-white text-xl font-semibold">{t.title}</h1>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-text-muted">
            <Link to={ROUTES.SETTINGS} className="hover:text-white transition-colors"><Settings size={18} /></Link>
            <Link to={ROUTES.SETTINGS} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Priyanshu" alt="Avatar" className="w-full h-full object-cover" />
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex gap-8 px-8 py-8 overflow-y-auto custom-scrollbar">
        {!activeModule ? (
          /* FOLDER / MODULE SELECTION GRID VIEW */
          <div className="flex-1 max-w-6xl mx-auto py-4 animate-in fade-in duration-500 w-full">
            <div className="text-center mb-12">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-4 py-1.5 rounded-full mb-4 inline-block shadow-lg shadow-primary/10">
                {language === 'en' ? 'STRUCTURED LEARNING FOLDERS' : 'संरचित शिक्षण फ़ोल्डर'}
              </Badge>
              <h2 className="text-white font-bold text-4xl tracking-tight mb-4">
                {language === 'en' ? 'Select a Learning Module' : 'एक लर्निंग मॉड्यूल चुनें'}
              </h2>
              <p className="text-text-secondary text-base max-w-xl mx-auto leading-relaxed">
                {language === 'en' 
                  ? 'Choose a domain folder below to get specialized, context-aware AI tutoring tailored to your specific field of study.'
                  : 'अपने विशिष्ट क्षेत्र के अनुरूप विशेष, संदर्भ-जागरूक AI ट्यूशन प्राप्त करने के लिए नीचे एक डोमेन फ़ॉल्डर चुनें।'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MODULES.map((mod) => {
                const IconComponent = mod.icon;
                return (
                  <div 
                    key={mod.id}
                    onClick={() => {
                      setActiveModule(mod.id);
                      setExplanation(null);
                      setMismatchError(null);
                      setTopic('');
                      setCharCount(0);
                    }}
                    className="group relative bg-[#1A2333]/40 border border-border/40 hover:border-primary/50 rounded-3xl p-8 hover:bg-[#1A2333]/80 transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 opacity-50" />
                    
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg", mod.color)}>
                          <IconComponent size={28} className="text-white" />
                        </div>
                        <Badge className={cn("text-[10px] font-bold px-2.5 py-1 rounded-lg border", mod.badgeColor)}>
                          {language === 'en' ? 'Folder' : 'फ़ोल्डर'}
                        </Badge>
                      </div>

                      <h3 className="text-white font-bold text-xl mb-3 group-hover:text-primary transition-colors tracking-tight">
                        {language === 'en' ? mod.name : mod.nameHi}
                      </h3>
                      
                      <p className="text-text-secondary text-sm leading-relaxed mb-6 font-medium">
                        {language === 'en' ? mod.desc : mod.descHi}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-border/40 flex items-center justify-between text-sm font-bold text-text-secondary group-hover:text-white transition-colors">
                      <span className="flex items-center gap-2">
                        <Folder size={16} className="text-primary" /> 
                        {language === 'en' ? 'Open Folder' : 'फ़ोल्डर खोलें'}
                      </span>
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform text-primary" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ACTIVE MODULE LEARN CHAT VIEW */
          <>
            {/* LEFT CONTENT */}
            <div className="flex-1 max-w-4xl animate-in fade-in duration-300">
              {/* Active Module Header & Switcher */}
              <div className="mb-8 bg-[#1A2333]/40 border border-border/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setActiveModule(null);
                      setExplanation(null);
                      setMismatchError(null);
                      setTopic('');
                      setCharCount(0);
                    }}
                    className="bg-[#0D1626] hover:bg-primary/20 text-text-secondary hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-border/40 hover:border-primary/40 transition-all active:scale-95"
                  >
                    <ArrowLeft size={14} /> {language === 'en' ? 'All Folders' : 'सभी फ़ोल्डर'}
                  </button>
                  <div className="h-6 w-px bg-border/40" />
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", currentModConfig.color)}>
                      {React.createElement(currentModConfig.icon, { size: 16, className: "text-white" })}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm leading-none">
                        {language === 'en' ? currentModConfig.name : currentModConfig.nameHi}
                      </h3>
                      <span className="text-text-muted text-[10px]">
                        {language === 'en' ? 'Active Module' : 'सक्रिय मॉड्यूल'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Module Switcher Pills */}
                <div className="flex flex-wrap items-center gap-1.5 bg-[#0D1626]/80 p-1 rounded-xl border border-border/30">
                  {MODULES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveModule(m.id);
                        setExplanation(null);
                        setMismatchError(null);
                        setTopic('');
                        setCharCount(0);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                        activeModule === m.id 
                          ? "bg-primary text-white shadow-md shadow-primary/20" 
                          : "text-text-muted hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Folder size={12} className={activeModule === m.id ? "text-white" : "text-text-muted"} />
                      {language === 'en' ? m.name.split(' ')[0] : m.nameHi.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <div className={cn(
                  "flex items-center bg-[#1A2333]/50 border border-border/50 rounded-2xl h-14 px-4 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10",
                  explainMutation.isPending && "opacity-70 pointer-events-none"
                )}>
                  <Search size={18} className="text-text-muted flex-shrink-0" />
                  <input
                    className="flex-1 bg-transparent ml-3 text-white placeholder:text-text-muted outline-none text-sm"
                    placeholder={activePlaceholder}
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value);
                      setCharCount(e.target.value.length);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
                    maxLength={500}
                  />
                  <span className={cn(
                    "text-[10px] font-mono mr-4 transition-colors",
                    charCount > 450 ? "text-error" : "text-text-muted"
                  )}>
                    {charCount}/500
                  </span>
                  <button 
                    onClick={handleExplain}
                    disabled={!topic.trim() || explainMutation.isPending}
                    className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
                  >
                    {explainMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
                    {t.startLearning}
                  </button>
                </div>
                {charCount >= 500 && <p className="text-error text-[10px] mt-1.5 ml-1">Topic query too long (max 500 characters)</p>}
              </div>

              {/* STATES */}
              {explainMutation.isPending ? (
                <div className="mt-8 space-y-6 bg-[#1A2333]/30 border border-border/30 rounded-2xl p-8">
                  <Skeleton className="h-8 w-64 rounded-lg" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-[90%] rounded" />
                    <Skeleton className="h-4 w-[95%] rounded" />
                  </div>
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : mismatchError ? (
                /* MISMATCH WARNING CARD */
                <div className="mt-8 bg-amber-500/10 border border-amber-500/30 rounded-3xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6 text-amber-400 shadow-lg shadow-amber-500/10">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-white font-bold text-2xl tracking-tight mb-3">
                    {language === 'en' ? 'Topic Mismatch Detected' : 'विषय बेमेल पाया गया'}
                  </h3>
                  <p className="text-text-secondary text-base max-w-md leading-relaxed mb-8 font-medium">
                    {language === 'en' 
                      ? `"${mismatchError.topic}" appears to belong to the "${mismatchError.suggestedModule}" folder. We cannot answer this topic inside "${mismatchError.currentModule}".`
                      : `"${mismatchError.topic}" विषय "${mismatchError.suggestedModule}" फ़ोल्डर से संबंधित प्रतीत होता है। हम "${mismatchError.currentModule}" के अंदर इस विषय का उत्तर नहीं दे सकते।`}
                  </p>
                  <button
                    onClick={() => {
                      setActiveModule(mismatchError.suggestedModule);
                      setMismatchError(null);
                      setTopic(mismatchError.topic);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
                  >
                    {language === 'en' ? `Go to ${mismatchError.suggestedModule}` : `${mismatchError.suggestedModule} पर जाएं`}
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : !explanation ? (
                /* INITIAL PROMPT STATE */
                <div className="mt-20 flex flex-col items-center text-center">
                  <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center mb-6 animate-pulse shadow-lg", currentModConfig.badgeColor)}>
                    {React.createElement(currentModConfig.icon, { size: 40, className: "text-current" })}
                  </div>
                  <h3 className="text-white font-bold text-2xl tracking-tight">
                    {language === 'en' ? `Ask anything in ${currentModConfig.name}` : `${currentModConfig.nameHi} में कुछ भी पूछें`}
                  </h3>
                  <p className="text-text-secondary text-base mt-3 max-w-sm leading-relaxed font-medium">
                    {language === 'en' 
                      ? `Enter any topic above related to ${currentModConfig.name}. Your AI tutor will explain it simply with real-life examples.`
                      : `${currentModConfig.nameHi} से संबंधित कोई भी विषय ऊपर दर्ज करें। आपका AI ट्यूटर इसे वास्तविक जीवन के उदाहरणों के साथ सरलता से समझाएगा।`}
                  </p>
                  <div className="flex flex-wrap gap-2.5 mt-10 justify-center">
                    {activeSampleTopics.map(t => (
                      <button 
                        key={t} 
                        onClick={() => {
                          setTopic(t);
                          setCharCount(t.length);
                        }}
                        className="bg-[#1A2333]/50 border border-border/50 rounded-full px-5 py-2 text-text-secondary text-sm font-medium hover:border-primary hover:text-white hover:bg-primary/5 transition-all cursor-pointer shadow-sm"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* ACTIVE EXPLANATION STATE */
                <div className="mt-8 bg-[#1A2333]/30 border border-border/40 rounded-3xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-white text-3xl font-bold tracking-tight">{explanation.topic}</h2>
                    {explanation.codeLanguage && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {explanation.codeLanguage}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-text-secondary text-[15px] leading-relaxed mb-8 space-y-4 font-medium">
                    {(typeof explanation?.explanation === 'object' 
                      ? Object.values(explanation.explanation).join('\n\n') 
                      : (explanation?.explanation || 'No explanation available.'))
                      .split('\n\n')
                      .filter(p => p.trim())
                      .map((paragraph, idx) => renderFormattedParagraph(paragraph, idx))
                    }
                  </div>
                  
                  {explanation.codeExample && (
                    <div className="relative group mb-8">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                      <div className="relative bg-[#0D1626] border border-border/40 rounded-xl p-6 font-mono text-[13px] leading-relaxed overflow-x-auto custom-scrollbar">
                        <pre className="text-gray-300">
                          <code>{explanation.codeExample}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {explanation.realLifeExample && (
                    <div className="bg-gradient-to-br from-[#2A1B0E] to-[#1A1208] border border-orange-900/20 rounded-2xl p-6 mb-8 flex gap-4 shadow-lg">
                      <div className="bg-[#D97706] rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-900/20">
                        <Lightbulb size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[#FBBF24] font-bold text-sm">{t.realLifeExample}</p>
                        <p className="text-orange-100/70 text-sm mt-1.5 leading-relaxed font-medium">
                          {explanation?.realLifeExample || 'No example available.'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {explanation?.subtopics && explanation.subtopics.length > 0 && (
                    <div className="mb-8">
                      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-4">SUBTOPICS COVERED</p>
                      <div className="flex flex-wrap gap-2.5">
                        {explanation.subtopics.map(s => (
                          <button 
                            key={s} 
                            onClick={() => {
                              setTopic(s);
                              setCharCount(s.length);
                            }}
                            className="bg-[#1A2333]/50 border border-border/40 rounded-xl px-4 py-2 text-text-secondary text-sm font-medium hover:border-primary hover:text-white transition-all shadow-sm"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4 pt-4 border-t border-border/30">
                    <Link 
                      to={`/quiz/${encodeURIComponent(explanation.topic)}`} 
                      state={{ explanation }}
                      className="flex-1 sm:flex-none"
                    >
                      <button className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <ClipboardList size={18} /> {t.takeQuiz}
                      </button>
                    </Link>
                    <button 
                      onClick={handleSaveNotes}
                      className="flex-1 sm:flex-none bg-[#1A2333]/50 border border-border/40 hover:border-primary/50 text-text-secondary hover:text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all active:scale-95"
                    >
                      <Bookmark size={18} /> {t.saveToNotes}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT PANEL */}
            <aside className="w-80 flex-shrink-0 flex flex-col gap-6 animate-in fade-in duration-300">
              {/* Related Topics Card */}
              <div className="bg-[#1A2333]/30 border border-border/40 rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-5">
                  <h4 className="text-white font-bold text-sm">{t.subtopics}</h4>
                </div>
                
                <div className="space-y-1">
                  {!explanation ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="py-3 flex gap-3">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 flex-1 rounded" />
                      </div>
                    ))
                  ) : (
                    explanation?.subtopics?.map?.((s, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setTopic(s);
                          setCharCount(s.length);
                        }}
                        className="w-full flex items-center gap-3 py-3 text-text-secondary hover:text-primary transition-all text-sm group text-left"
                      >
                        <div className="bg-[#1A2333] p-1.5 rounded-lg group-hover:bg-primary/10 transition-colors">
                          <Hash size={14} className="text-text-muted group-hover:text-primary" />
                        </div>
                        <span className="font-medium">{s}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Ask Follow-up Card */}
              <div className="bg-[#1A2333]/30 border border-border/40 rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={16} className="text-primary" />
                  <h4 className="text-white font-bold text-sm">{language === 'en' ? 'Ask Follow-up' : 'अनुवर्ती प्रश्न पूछें'}</h4>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed mb-5 font-medium">
                  {language === 'en' 
                    ? "Confused about a specific part? Ask me to elaborate."
                    : "किसी विशिष्ट भाग के बारे में उलझन में हैं? मुझसे विस्तार से बताने के लिए कहें।"}
                </p>
                
                <div className="relative">
                  <textarea 
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleFollowUp();
                      }
                    }}
                    placeholder={language === 'en' ? "e.g. Can you explain tail recursion again with a visual?" : "जैसे: क्या आप विज़ुअल के साथ टेल रिकर्शन को फिर से समझा सकते हैं?"}
                    className="w-full bg-[#0D1626] border border-border/40 rounded-2xl p-4 text-xs text-white placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[120px] resize-none transition-all shadow-inner"
                  />
                  <button 
                    onClick={handleFollowUp}
                    disabled={!followUp.trim() || !explanation || followUpMutation.isPending}
                    className="absolute bottom-3 right-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white p-2 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-90"
                  >
                    {followUpMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>

              {/* Decorative/Informative AI Core */}
              <div className="mt-auto relative rounded-3xl overflow-hidden aspect-square border border-border/40 group bg-[#0D1626] shadow-xl">
                {/* Pulsating Neural Core (Background / Fallback) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                  <div className="w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full animate-spin-slow opacity-20" />
                    <div className="absolute inset-2 bg-gradient-to-tr from-primary to-transparent rounded-full animate-reverse-spin opacity-40" />
                  </div>
                </div>

                {/* The Image (Main Visual) */}
                <img 
                  src="/src/assets/ai-robot.png" 
                  alt="AI Developer Robot" 
                  className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />

                {/* Neural Network "Lines" using CSS Gradients */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-primary" />
                    <span className="text-primary font-bold text-[10px] uppercase tracking-wider">{language === 'en' ? 'AI Powered' : 'AI संचालित'}</span>
                  </div>
                  <p className="text-white font-bold text-sm leading-snug">
                    {language === 'en' ? 'Unlock complex concepts in seconds' : 'सेकंडों में जटिल अवधारणाओं को अनलॉक करें'}
                  </p>
                </div>
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  );
};

export default LearnPage;
