// 物流追踪API路由 - 支持快递100 API和AfterShip API
import { NextRequest, NextResponse } from 'next/server';

// 物流状态映射（根据快递100的状态码）
const STATUS_MAP: Record<string, { status: string; description: string }> = {
  // 快递100 state字段（主要状态码）
  '0': { status: 'In Transit', description: '运输中' },
  '1': { status: 'In Transit', description: '已揽收' },
  '2': { status: 'Exception', description: '疑难件' },
  '3': { status: 'Delivered', description: '已签收' },
  
  // 1000系列状态码（快递100）
  '1000': { status: 'Delivered', description: '已签收' },
  '1001': { status: 'In Transit', description: '已揽收' },
  '1002': { status: 'In Transit', description: '运输中' },
  '1003': { status: 'Exception', description: '异常' },
  '1004': { status: 'Returned', description: '退回' },
  
  // condition字段状态码（快递100）
  '00': { status: 'In Transit', description: '揽收中' },
  
  // 标准状态码
  'F00': { status: 'In Transit', description: '暂无信息' },
  'F01': { status: 'In Transit', description: '已揽收' },
  'F02': { status: 'In Transit', description: '在途中' },
  'F03': { status: 'In Transit', description: '运输中' },
  'F04': { status: 'Out for Delivery', description: '派送中' },
  'F05': { status: 'Delivered', description: '已签收' },
  'F06': { status: 'Exception', description: '异常' },
  'F07': { status: 'Exception', description: '拒收' },
  'F08': { status: 'Returned', description: '退回' },
  
  // 其他常见状态码
  'H100': { status: 'In Transit', description: '运输中' },
  'H101': { status: 'Out for Delivery', description: '准备派送' },
  'H102': { status: 'Delivered', description: '已签收' },
  'H103': { status: 'Exception', description: '问题件' },
  'H104': { status: 'Returned', description: '退回中' },
  
  // 邮政/EMS状态码
  '201': { status: 'In Transit', description: '运输中' },
  '202': { status: 'Out for Delivery', description: '派送中' },
  '203': { status: 'Delivered', description: '已签收' },
  '204': { status: 'Exception', description: '异常' },
  '205': { status: 'Returned', description: '退回' },
  
  // J1000系列状态码（快递100缓存状态）
  'J1000': { status: 'Delivered', description: '已签收' },
  'J1001': { status: 'Out for Delivery', description: '派送中' },
  'J1002': { status: 'In Transit', description: '运输中' },
  
  // 通用状态
  '200': { status: 'Success', description: '查询成功' },
  'ok': { status: 'In Transit', description: '查询成功' },
};

// AfterShip状态映射
const AFTERSHIP_STATUS_MAP: Record<string, { status: string; description: string }> = {
  'Pending': { status: 'Pending', description: '等待处理' },
  'Unknown': { status: 'Unknown', description: '未知状态' },
  'Tracking': { status: 'In Transit', description: '运输中' },
  'Transferred': { status: 'In Transit', description: '转运中' },
  'Delivered': { status: 'Delivered', description: '已签收' },
  'Failure': { status: 'Exception', description: '投递失败' },
  'Returned': { status: 'Returned', description: '已退回' },
  'OutForDelivery': { status: 'Out for Delivery', description: '派送中' },
  'DeliveredFailed': { status: 'Exception', description: '投递失败' },
  'Expired': { status: 'Expired', description: '已过期' },
};

// 快递公司名称映射
const CARRIER_NAME_MAP: Record<string, string> = {
  'shunfeng': '顺丰速运',
  'sto': '申通快递',
  'yto': '圆通速递',
  'zto': '中通快递',
  'yd': '韵达快递',
  'ems': 'EMS',
  'ups': 'UPS',
  'fedex': 'FedEx',
  'dhl': 'DHL',
  'usps': 'USPS',
};

// AfterShip承运商标识映射
const AFTERSHIP_CARRIER_MAP: Record<string, string> = {
  'ups': 'ups',
  'fedex': 'fedex',
  'dhl': 'dhl',
  'usps': 'usps',
  'tnt': 'tnt',
  '顺丰': 'shunfeng',
  '中通': 'zhongtong',
  '圆通': 'yuantong',
  '韵达': 'yunda',
  '申通': 'shentong',
  'ems': 'ems',
};

// 国际快递承运商列表
const INTERNATIONAL_CARRIERS = ['ups', 'fedex', 'dhl', 'usps', 'tnt', 'tnt-express'];

// 快递100 API查询
async function queryKuaidi100(trackingNumber: string, carrier?: string): Promise<any> {
  const carrierParam = carrier && carrier !== 'auto' ? carrier : 'auto';
  const url = `https://www.kuaidi100.com/query?type=${carrierParam}&postid=${trackingNumber}&temp=${Date.now()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.kuaidi100.com/',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
}

// AfterShip API查询
async function queryAfterShip(trackingNumber: string, carrier: string, apiKey: string): Promise<any> {
  const carrierCode = AFTERSHIP_CARRIER_MAP[carrier] || carrier;
  const url = `https://api.aftership.com/v4/trackings/${carrierCode}/${trackingNumber}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'aftership-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('API密钥无效，请检查配置');
    }
    if (response.status === 404) {
      throw new Error('未找到该追踪号的信息');
    }
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
}

// 格式化响应数据（快递100）
function formatKuaidi100Response(data: any, trackingNumber: string) {
  let statusInfo = { status: 'Unknown', description: '未知状态' };
  
  if (data.data && data.data.length > 0) {
    const latestEvent = data.data[0].context || '';
    
    if (latestEvent.includes('签收') || latestEvent.includes('已取件') || latestEvent.includes('已代收')) {
      statusInfo = { status: 'Delivered', description: '已签收' };
    } else if (latestEvent.includes('派送') || latestEvent.includes('正在为您派件') || latestEvent.includes('派件中')) {
      statusInfo = { status: 'Out for Delivery', description: '派送中' };
    } else if (latestEvent.includes('揽收') || latestEvent.includes('已收取') || latestEvent.includes('已取件')) {
      statusInfo = { status: 'In Transit', description: '已揽收' };
    } else if (latestEvent.includes('退回') || latestEvent.includes('退件') || latestEvent.includes('退回')) {
      statusInfo = { status: 'Returned', description: '已退回' };
    } else if (latestEvent.includes('问题') || latestEvent.includes('异常')) {
      statusInfo = { status: 'Exception', description: '异常' };
    } else if (latestEvent.includes('拒收')) {
      statusInfo = { status: 'Rejected', description: '拒收' };
    } else if (latestEvent.includes('到达')) {
      statusInfo = { status: 'In Transit', description: '运输中' };
    } else if (latestEvent.includes('离开') || latestEvent.includes('发往')) {
      statusInfo = { status: 'In Transit', description: '运输中' };
    } else {
      statusInfo = { status: 'In Transit', description: '运输中' };
    }
  } else {
    const state = String(data.state || '0');
    const condition = String(data.condition || '');
    statusInfo = STATUS_MAP[state] || STATUS_MAP[condition] || { status: 'Pending', description: '暂无物流信息' };
  }
  
  const events = (data.data || []).map((item: any) => {
    let eventStatus = statusInfo.status;
    const eventContext = item.context || '';
    
    if (eventContext.includes('签收') || eventContext.includes('已取件')) {
      eventStatus = 'Delivered';
    } else if (eventContext.includes('派送') || eventContext.includes('正在为您派件')) {
      eventStatus = 'Out for Delivery';
    } else if (eventContext.includes('揽收') || eventContext.includes('已收取')) {
      eventStatus = 'In Transit';
    } else if (eventContext.includes('退回') || eventContext.includes('退件')) {
      eventStatus = 'Returned';
    } else if (eventContext.includes('异常') || eventContext.includes('问题')) {
      eventStatus = 'Exception';
    }
    
    return {
      date: item.ftime?.split(' ')[0] || item.time?.split(' ')[0] || '',
      time: item.ftime?.split(' ')[1] || item.time || '',
      status: eventStatus,
      location: item.location || '',
      description: eventContext,
    };
  });
  
  if (events.length === 0) {
    events.push({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      status: statusInfo.status,
      location: '',
      description: statusInfo.description,
    });
  }
  
  const carrierName = CARRIER_NAME_MAP[data.com] || data.com || 'Unknown';
  
  return {
    status: statusInfo.status,
    description: statusInfo.description,
    location: events[0]?.location || '',
    carrier: carrierName,
    carrierCode: data.com || '',
    trackingNumber: trackingNumber,
    events: events.reverse(),
    source: 'kuaidi100',
  };
}

// 格式化响应数据（AfterShip）
function formatAfterShipResponse(data: any, trackingNumber: string) {
  const tracking = data.data?.tracking;
  
  if (!tracking) {
    return {
      status: 'Unknown',
      description: '未知状态',
      location: '',
      carrier: tracking?.slug || 'Unknown',
      trackingNumber: trackingNumber,
      events: [],
      source: 'aftership',
    };
  }
  
  const statusInfo = AFTERSHIP_STATUS_MAP[tracking.status] || { 
    status: 'Unknown', 
    description: tracking.status || '未知状态' 
  };
  
  const events = (tracking.checkpoints || []).map((checkpoint: any) => {
    const checkpointStatus = AFTERSHIP_STATUS_MAP[checkpoint.tag] || { 
      status: 'In Transit', 
      description: checkpoint.tag || '运输中' 
    };
    
    return {
      date: checkpoint.created_at?.split('T')[0] || '',
      time: checkpoint.created_at?.split('T')[1]?.split('.')[0] || '',
      status: checkpointStatus.status,
      location: checkpoint.location || checkpoint.checkpoint_location?.city || '',
      description: checkpoint.message || checkpoint.tag || '状态更新',
    };
  });
  
  if (events.length === 0) {
    events.push({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      status: statusInfo.status,
      location: '',
      description: statusInfo.description,
    });
  }
  
  return {
    status: statusInfo.status,
    description: statusInfo.description,
    location: tracking.checkpoints?.[0]?.location || tracking.checkpoints?.[0]?.checkpoint_location?.city || '',
    carrier: tracking.slug || 'Unknown',
    carrierCode: tracking.slug || '',
    trackingNumber: trackingNumber,
    events: events,
    source: 'aftership',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { trackingNumber, carrier, apiKey } = await request.json();
    
    if (!trackingNumber) {
      return NextResponse.json(
        { error: '请提供追踪号' },
        { status: 400 }
      );
    }
    
    const cleanNumber = trackingNumber.trim().toUpperCase();
    const cleanCarrier = carrier?.toLowerCase() || 'auto';
    
    console.info(`查询物流追踪: ${cleanNumber}, 承运商: ${cleanCarrier}`);
    
    let result;
    
    // 判断使用哪个API
    // 1. 如果是国际快递且提供了API密钥，使用AfterShip
    // 2. 否则使用快递100（国内快递）
    if (INTERNATIONAL_CARRIERS.includes(cleanCarrier) && apiKey) {
      try {
        console.info(`使用AfterShip API查询: ${cleanNumber}`);
        const aftershipData = await queryAfterShip(cleanNumber, cleanCarrier, apiKey);
        result = formatAfterShipResponse(aftershipData, cleanNumber);
        console.info(`AfterShip查询成功: ${cleanNumber}, 状态: ${result.status}`);
      } catch (aftershipError) {
        console.error(`AfterShip查询失败:`, aftershipError);
        // AfterShip失败时，尝试快递100作为备选
        try {
          console.info(`尝试使用快递100备选查询: ${cleanNumber}`);
          const kuaidiData = await queryKuaidi100(cleanNumber, cleanCarrier);
          result = formatKuaidi100Response(kuaidiData, cleanNumber);
        } catch {
          throw aftershipError; // 如果快递100也失败，抛出原错误
        }
      }
    } else {
      // 使用快递100 API（国内快递）
      console.info(`使用快递100 API查询: ${cleanNumber}`);
      const kuaidiData = await queryKuaidi100(cleanNumber, cleanCarrier);
      result = formatKuaidi100Response(kuaidiData, cleanNumber);
      console.info(`快递100查询成功: ${cleanNumber}, 状态: ${result.status}, 承运商: ${result.carrier}`);
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error(`查询失败:`, error);
    
    const errorMessage = error instanceof Error ? error.message : '无法获取物流信息，请稍后重试';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 503 }
    );
  }
}
