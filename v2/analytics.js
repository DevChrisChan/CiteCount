(function() {
  'use strict';

  const ANALYTICS_SEND_COOLDOWN_MS = 60 * 1000;
  const ANALYTICS_LAST_SEND_KEY = 'citecount_analytics_last_send_at';
  let analyticsSendInFlight = false;

  // ============================================================================
  function getWebhookUrl() {
    const id = '1500622477250924597';
    const token = 'BdLE3UOg3ZSSEczC5md1v1FcHbB-fRAPQpfpiXlF6OUmhnZuM4itMdQ6FDQITG3tSLHF';
    
    try {
      return `https://discord.com/api/webhooks/${id}/${token}`;
    } catch (e) {
      console.error('Failed to reconstruct webhook URL');
      return null;
    }
  }

  // ============================================================================
  // USER AGENT PARSING
  // ============================================================================
  function parseUserAgent() {
    const ua = navigator.userAgent;
    
    // Detect Browser
    let browser = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (/Chrome/.test(ua) && !/Chromium|Edg/.test(ua)) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      if (match) browserVersion = match[1];
    } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      if (match) browserVersion = match[1];
    } else if (/Firefox/.test(ua)) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      if (match) browserVersion = match[1];
    } else if (/Edg/.test(ua)) {
      browser = 'Edge';
      const match = ua.match(/Edg\/(\d+)/);
      if (match) browserVersion = match[1];
    } else if (/OPR|Opera/.test(ua)) {
      browser = 'Opera';
      const match = ua.match(/OPR\/(\d+)/);
      if (match) browserVersion = match[1];
    }

    // Detect OS
    let os = 'Unknown';
    let osVersion = 'Unknown';
    
    if (/Windows/.test(ua)) {
      os = 'Windows';
      const match = ua.match(/Windows NT ([\d.]+)/);
      if (match) osVersion = match[1];
    } else if (/Macintosh/.test(ua)) {
      os = 'macOS';
      const match = ua.match(/Mac OS X ([\d_]+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    } else if (/Android/.test(ua)) {
      os = 'Android';
      const match = ua.match(/Android ([\d.]+)/);
      if (match) osVersion = match[1];
    } else if (/iPhone|iPad|iPod/.test(ua)) {
      os = 'iOS';
      const match = ua.match(/OS ([\d_]+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    } else if (/Linux/.test(ua)) {
      os = 'Linux';
    }

    // Detect Device Type
    let deviceType = 'Desktop';
    if (/Mobile|Android|iPhone|iPad|iPod|Windows Phone/.test(ua)) {
      if (/iPad|Android/.test(ua) && !/Mobile/.test(ua)) {
        deviceType = 'Tablet';
      } else {
        deviceType = 'Mobile';
      }
    }

    return {
      browser: `${browser} ${browserVersion}`,
      os: `${os} ${osVersion}`,
      deviceType,
      fullUserAgent: ua
    };
  }

  // ============================================================================
  // GET OR CREATE USER ID
  // ============================================================================
  function getUserId() {
    const storageKey = 'citecount_analytics_user_id';
    let userId = localStorage.getItem(storageKey);
    
    if (!userId) {
      // Generate random 8-digit number
      userId = String(Math.floor(Math.random() * 90000000) + 10000000);
      localStorage.setItem(storageKey, userId);
    }
    
    return userId;
  }

  // ============================================================================
  // GET GENERAL ANONYMOUS GEOLOCATION FROM IP
  // ============================================================================
  async function getGeolocation() {
    try {
      // Using free IP geolocation service
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Geolocation request failed');
      
      const data = await response.json();
      return {
        country: data.country_name || 'Unknown',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown'
      };
    } catch (error) {
      console.log('Geolocation lookup failed:', error);
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown'
      };
    }
  }

  // ============================================================================
  // FORMAT TIMESTAMP FOR DISCORD
  // ============================================================================
  function getDiscordTimestamp() {
    // Unix timestamp for Discord
    return Math.floor(Date.now() / 1000);
  }

  // ============================================================================
  // SEND ANALYTICS TO DISCORD
  // ============================================================================
  function canSendAnalytics() {
    const lastSendAt = Number(localStorage.getItem(ANALYTICS_LAST_SEND_KEY) || 0);
    return !lastSendAt || Date.now() - lastSendAt >= ANALYTICS_SEND_COOLDOWN_MS;
  }

  async function sendAnalytics() {
    if (analyticsSendInFlight || !canSendAnalytics()) {
      return;
    }

    analyticsSendInFlight = true;
    localStorage.setItem(ANALYTICS_LAST_SEND_KEY, String(Date.now()));

    try {
      const webhookUrl = getWebhookUrl();
      if (!webhookUrl) {
        console.error('Webhook URL unavailable');
        analyticsSendInFlight = false;
        return;
      }

      // Gather all analytics data
      const userAgent = parseUserAgent();
      const userId = getUserId();
      const geolocation = await getGeolocation();
      const timestamp = getDiscordTimestamp();
      const currentPage = window.location.pathname || '/';
      const referrer = document.referrer || 'Direct/None';

      // Build Discord Embed
      const embed = {
        title: '📊 Website Analytics',
        color: 0x1f2937, // Dark gray
        timestamp: new Date(timestamp * 1000).toISOString(),
        fields: [
          {
            name: '👤 User ID',
            value: `\`${userId}\``,
            inline: true
          },
          {
            name: '📱 Device Type',
            value: userAgent.deviceType,
            inline: true
          },
          {
            name: '🌐 Browser',
            value: userAgent.browser,
            inline: true
          },
          {
            name: '💻 Operating System',
            value: userAgent.os,
            inline: true
          },
          {
            name: '🗺️ Location',
            value: `${geolocation.city}, ${geolocation.region}, ${geolocation.country}`,
            inline: false
          },
          {
            name: '📄 Current Page',
            value: `\`${currentPage}\``,
            inline: true
          },
          {
            name: '🔗 Referrer',
            value: referrer.substring(0, 100) || 'None',
            inline: false
          },
          {
            name: '⏰ Timestamp',
            value: `<t:${timestamp}:D> <t:${timestamp}:T> (<t:${timestamp}:R>)`,
            inline: false
          }
        ],
        footer: {
          text: 'CiteCount Analytics'
        }
      };

      // Prepare payload
      const payload = {
        embeds: [embed],
        username: 'CiteCount Analytics',
        avatar_url: 'https://citecount.com/assets/logo.svg'
      };

      // Send to Discord
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('Analytics sent successfully');
      } else {
        console.log('Analytics response:', response.status);
      }
    } catch (error) {
      // Silently fail to not impact user experience
      console.log('Analytics error (non-critical):', error);
    } finally {
      analyticsSendInFlight = false;
    }
  }

  // ============================================================================
  // INITIALIZE ANALYTICS ON PAGE LOAD
  // ============================================================================
  if (document.readyState === 'loading') {
    // DOM is still loading
    document.addEventListener('DOMContentLoaded', function() {
      // Wait for all resources to load
      window.addEventListener('load', sendAnalytics);
    });
  } else {
    // DOM is already loaded, wait for all resources
    window.addEventListener('load', sendAnalytics);
  }

  // Fallback: Send after 5 seconds if load event doesn't fire
  setTimeout(function() {
    sendAnalytics().catch(() => {});
  }, 5000);
})();
