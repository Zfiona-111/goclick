function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone.slice(0, 3) + '****'
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export async function sendOtp(phone: string, code: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER || 'log'
  try {
    if (provider === 'twilio') {
      await sendViaTwilio(phone, code)
    } else if (provider === 'aliyun') {
      await sendViaAliyun(phone, code)
    } else {
      // Development: log to server console only (never expose to client)
      console.log(`[SMS DEV] OTP for ${maskPhone(phone)}: ${code}`)
    }
  } catch {
    throw new Error('发送失败，请稍后重试')
  }
}

async function sendViaTwilio(phone: string, code: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromPhone = process.env.TWILIO_PHONE_NUMBER
  if (!accountSid || !authToken || !fromPhone) throw new Error('Twilio not configured')

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromPhone,
        To: phone,
        Body: `Your GoClick code: ${code}. Valid 5 min.`,
      }),
    }
  )
  if (!res.ok) throw new Error('Twilio request failed')
}

async function sendViaAliyun(phone: string, code: string): Promise<void> {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET
  const signName = process.env.ALIYUN_SMS_SIGN_NAME
  const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE
  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    throw new Error('Aliyun SMS not configured')
  }
  // Aliyun SMS via REST API (simplified — use official SDK in production)
  const params: Record<string, string> = {
    Action: 'SendSms',
    Version: '2017-05-25',
    Format: 'JSON',
    RegionId: 'cn-hangzhou',
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: Math.random().toString(36).slice(2),
    Timestamp: new Date().toISOString(),
    AccessKeyId: accessKeyId,
    PhoneNumbers: phone,
    SignName: signName,
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
  }
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')
  const stringToSign = `POST&${encodeURIComponent('/')}&${encodeURIComponent(sorted)}`
  const { createHmac } = await import('crypto')
  const signature = createHmac('sha1', accessKeySecret + '&')
    .update(stringToSign)
    .digest('base64')
  params.Signature = signature

  const body = new URLSearchParams(params)
  const res = await fetch('https://dysmsapi.aliyuncs.com/', { method: 'POST', body })
  const json = await res.json()
  if (json.Code !== 'OK') throw new Error('Aliyun SMS failed')
}
