'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Package, Plus, Search, Trash2, Copy, ExternalLink, 
  Info, Globe, Truck, MapPin, Clock, CheckCircle, AlertCircle, Loader2, Settings, Key, X
} from 'lucide-react';

// 快递公司列表
const CARRIERS = [
  { id: 'ups', name: 'UPS', color: 'bg-amber-500' },
  { id: 'fedex', name: 'FedEx', color: 'bg-purple-500' },
  { id: 'dhl', name: 'DHL', color: 'bg-yellow-500' },
  { id: 'usps', name: 'USPS', color: 'bg-blue-500' },
  { id: '顺丰', name: '顺丰速运', color: 'bg-red-500' },
  { id: '中通', name: '中通快递', color: 'bg-lime-500' },
  { id: '圆通', name: '圆通速递', color: 'bg-orange-500' },
  { id: '韵达', name: '韵达快递', color: 'bg-green-500' },
  { id: '申通', name: '申通快递', color: 'bg-teal-500' },
  { id: 'ems', name: 'EMS', color: 'bg-cyan-500' },
];

interface Package {
  id: string;
  trackingNumber: string;
  carrier: string;
  addedAt: number;
}

interface TrackingInfo {
  status: string;
  description: string;
  location: string;
  carrier: string;
  trackingNumber: string;
  events: Array<{
    date: string;
    time: string;
    status: string;
    location: string;
    description: string;
  }>;
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered': return 'text-green-400';
    case 'Out for Delivery': return 'text-blue-400';
    case 'In Transit': return 'text-cyan-400';
    case 'Exception': return 'text-red-400';
    default: return 'text-yellow-400';
  }
};

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Delivered': return <CheckCircle className="w-5 h-5 text-green-400" />;
    case 'Exception': return <AlertCircle className="w-5 h-5 text-red-400" />;
    default: return <Truck className="w-5 h-5 text-blue-400" />;
  }
};

// 国际快递承运商列表
const INTERNATIONAL_CARRIERS = ['ups', 'fedex', 'dhl', 'usps', 'tnt'];

export default function HomePage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTrackingNumber, setNewTrackingNumber] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('ups');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiConfigured, setIsApiConfigured] = useState(false);

  // 加载保存的追踪码和API密钥
  useEffect(() => {
    const savedPackages = localStorage.getItem('tracking-packages');
    if (savedPackages) {
      try {
        setPackages(JSON.parse(savedPackages));
      } catch (e) {
        console.error('Failed to load saved packages:', e);
      }
    }
    
    // 加载API密钥
    const savedApiKey = localStorage.getItem('tracking-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsApiConfigured(true);
    }
  }, []);

  // 保存追踪码
  useEffect(() => {
    localStorage.setItem('tracking-packages', JSON.stringify(packages));
  }, [packages]);

  // 保存API密钥
  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('tracking-api-key', apiKey.trim());
      setIsApiConfigured(true);
      setIsSettingsOpen(false);
    }
  };

  // 清除API密钥
  const clearApiKey = () => {
    localStorage.removeItem('tracking-api-key');
    setApiKey('');
    setIsApiConfigured(false);
  };

  // 添加追踪码
  const addPackage = () => {
    if (!newTrackingNumber.trim()) return;
    
    const exists = packages.some(p => p.trackingNumber === newTrackingNumber.trim().toUpperCase());
    if (exists) {
      setNewTrackingNumber('');
      setIsAddDialogOpen(false);
      return;
    }

    const newPkg: Package = {
      id: Date.now().toString(),
      trackingNumber: newTrackingNumber.trim().toUpperCase(),
      carrier: selectedCarrier,
      addedAt: Date.now(),
    };

    setPackages([...packages, newPkg]);
    setNewTrackingNumber('');
    setIsAddDialogOpen(false);
  };

  // 删除追踪码
  const deletePackage = (id: string) => {
    setPackages(packages.filter(p => p.id !== id));
  };

  // 复制追踪码
  const copyTrackingNumber = (num: string) => {
    navigator.clipboard.writeText(num);
  };

  // 获取追踪信息
  const fetchTrackingInfo = async (pkg: Package) => {
    setSelectedPackage(pkg);
    setTrackingInfo(null);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: pkg.trackingNumber,
          carrier: pkg.carrier,
          apiKey: localStorage.getItem('tracking-api-key') || '',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '查询失败');
      }

      const data = await response.json();
      setTrackingInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取物流信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取快递公司名称
  const getCarrierName = (carrierId: string) => {
    return CARRIERS.find(c => c.id === carrierId)?.name || carrierId;
  };

  // 获取快递公司颜色
  const getCarrierColor = (carrierId: string) => {
    return CARRIERS.find(c => c.id === carrierId)?.color || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部 */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Package className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">物流追踪系统</h1>
                <p className="text-xs text-slate-400">支持全球500+快递公司</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                <Globe className="w-3 h-3 mr-1" />
                {packages.length} 个包裹
              </Badge>
              <Button 
                onClick={() => setIsSettingsOpen(true)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {isApiConfigured ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                    API已配置
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    配置API
                  </>
                )}
              </Button>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加
              </Button>
            </div>

            {/* API配置弹窗 */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    API配置
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div className="text-sm text-blue-200 space-y-2">
                        <p><strong>为什么需要API密钥？</strong></p>
                        <p>获取UPS、FedEx、DHL等国际快递的物流数据需要使用AfterShip等物流追踪API。</p>
                        <p className="text-blue-300"><strong>AfterShip提供免费计划</strong>，每月可查询100次。</p>
                        <a 
                          href="https://www.aftership.com/signup" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-200 hover:text-white underline"
                        >
                          免费注册AfterShip API
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300">AfterShip API Key</label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="输入您的AfterShip API密钥"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                      {isApiConfigured && (
                        <Button 
                          onClick={clearApiKey}
                          variant="destructive"
                          size="icon"
                          className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      API密钥将安全保存在您浏览器的本地存储中
                    </p>
                  </div>

                  <Button onClick={saveApiKey} className="w-full bg-amber-500 hover:bg-amber-600 text-black">
                    保存配置
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* 添加追踪码弹窗 */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>添加追踪码</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {/* 承运商选择 */}
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300">选择承运商</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CARRIERS.map((carrier) => (
                        <button
                          key={carrier.id}
                          onClick={() => setSelectedCarrier(carrier.id)}
                          className={`p-2 rounded-lg border-2 transition-all text-left ${
                            selectedCarrier === carrier.id
                              ? 'border-amber-500 bg-amber-500/20'
                              : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                          }`}
                        >
                          <span className={`inline-block w-2 h-2 rounded-full ${carrier.color} mr-2`} />
                          <span className="text-white text-sm">{carrier.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 输入框 */}
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300">追踪码</label>
                    <Input
                      value={newTrackingNumber}
                      onChange={(e) => setNewTrackingNumber(e.target.value.toUpperCase())}
                      placeholder="例如: 1Z999AA10123456784"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 uppercase"
                      onKeyDown={(e) => e.key === 'Enter' && addPackage()}
                    />
                  </div>

                  <Button onClick={addPackage} className="w-full bg-amber-500 hover:bg-amber-600 text-black">
                    <Search className="w-4 h-4 mr-2" />
                    添加
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8">
        {/* 说明卡片 */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-slate-300 space-y-1">
                <p><strong className="text-white">使用方法：</strong> 点击列表中的追踪码，直接查看实时物流状态。</p>
                <p><strong className="text-white">支持快递：</strong> UPS、FedEx、DHL、USPS、顺丰、中通、圆通、韵达、申通、EMS等500+快递公司。</p>
                {isApiConfigured ? (
                  <p className="text-green-400"><strong>API已配置：</strong> 已配置AfterShip API，支持所有国际快递的真实物流数据！</p>
                ) : (
                  <>
                    <p className="text-amber-400"><strong>国际快递提示：</strong> 配置API密钥后支持UPS/FedEx/DHL等国际快递的真实物流数据。</p>
                    <p className="text-green-400"><strong>国内快递：</strong> 数据来自快递100 API，100%真实可靠，无需配置API！</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 追踪码列表 */}
        {packages.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">暂无追踪码</h3>
              <p className="text-slate-400 mb-6">点击右上角按钮添加您的第一个追踪码</p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加追踪码
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer group"
                onClick={() => fetchTrackingInfo(pkg)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={`${getCarrierColor(pkg.carrier)} text-white font-medium`}>
                      {getCarrierName(pkg.carrier)}
                    </Badge>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyTrackingNumber(pkg.trackingNumber);
                        }}
                        className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="复制追踪码"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePackage(pkg.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-mono text-lg text-white font-semibold tracking-wider">
                      {pkg.trackingNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      添加于 {new Date(pkg.addedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-slate-400">点击查看物流详情</span>
                    {getStatusIcon('In Transit')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* 物流详情弹窗 */}
      <Dialog open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              物流详情
            </DialogTitle>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="pt-4 space-y-6">
              {/* 追踪码信息 */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">追踪码</span>
                  <Badge className={`${getCarrierColor(selectedPackage.carrier)} text-white`}>
                    {getCarrierName(selectedPackage.carrier)}
                  </Badge>
                </div>
                <p className="font-mono text-xl text-white font-semibold">
                  {selectedPackage.trackingNumber}
                </p>
              </div>

              {/* 加载状态 */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <span className="ml-3 text-slate-400">正在查询物流信息...</span>
                </div>
              )}

              {/* 错误状态 */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                  <button 
                    onClick={() => fetchTrackingInfo(selectedPackage)}
                    className="mt-3 text-sm text-red-300 hover:text-red-200 underline"
                  >
                    点击重试
                  </button>
                </div>
              )}

              {/* 物流信息 */}
              {trackingInfo && (
                <>
                  {/* 当前状态 */}
                  <div className={`rounded-lg p-4 border ${
                    trackingInfo.status === 'Delivered' 
                      ? 'bg-green-500/20 border-green-500/50'
                      : trackingInfo.status === 'Exception'
                      ? 'bg-red-500/20 border-red-500/50'
                      : 'bg-blue-500/20 border-blue-500/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        trackingInfo.status === 'Delivered' 
                          ? 'bg-green-500/30'
                          : trackingInfo.status === 'Exception'
                          ? 'bg-red-500/30'
                          : 'bg-blue-500/30'
                      }`}>
                        {getStatusIcon(trackingInfo.status)}
                      </div>
                      <div>
                        <p className={`text-lg font-semibold ${getStatusColor(trackingInfo.status)}`}>
                          {trackingInfo.description}
                        </p>
                        {trackingInfo.location && (
                          <p className="text-sm text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {trackingInfo.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 国际快递提示（未配置API时） */}
                  {!isApiConfigured && INTERNATIONAL_CARRIERS.includes(selectedPackage.carrier) ? (
                    <div className="mt-4">
                      <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-amber-300 text-sm font-semibold">需要配置API密钥</p>
                            <p className="text-amber-200/80 text-sm mt-1">
                              获取UPS/FedEx/DHL等国际快递的真实物流数据，需要配置AfterShip API密钥。
                            </p>
                            <div className="flex gap-2 mt-3">
                              <button 
                                onClick={() => setIsSettingsOpen(true)}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors text-sm font-medium"
                              >
                                配置API密钥
                              </button>
                              <button 
                                onClick={() => {
                                  const urls: Record<string, string> = {
                                    ups: `https://www.ups.com/track?tracknum=${selectedPackage.trackingNumber}&loc=zh_CN`,
                                    fedex: `https://www.fedex.com/fedextrack/?trknbr=${selectedPackage.trackingNumber}`,
                                    dhl: `https://www.dhl.com/cn-en/home/tracking.html?tracking-id=${selectedPackage.trackingNumber}`,
                                    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${selectedPackage.trackingNumber}`,
                                  };
                                  window.open(urls[selectedPackage.carrier] || `https://www.17track.net/zh-cn/result/${selectedPackage.trackingNumber}.html`, '_blank');
                                }}
                                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium"
                              >
                                打开官方页面
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : trackingInfo.events.length > 0 ? (
                    /* 物流时间线 */
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        物流历史
                      </h4>
                      <div className="space-y-4">
                        {trackingInfo.events.map((event, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${
                                index === 0 ? 'bg-amber-500' : 'bg-slate-600'
                              }`} />
                              {index < trackingInfo.events.length - 1 && (
                                <div className="w-0.5 h-full bg-slate-700 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-white text-sm">{event.description}</p>
                              {event.location && (
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 mt-1">
                                {event.date} {event.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-700/50 rounded-lg p-4 text-center text-slate-400">
                      暂无物流信息
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 页脚 */}
      <footer className="border-t border-white/10 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>国内快递：快递100 API | 国际快递：AfterShip API（需配置密钥）</p>
        </div>
      </footer>
    </div>
  );
}
