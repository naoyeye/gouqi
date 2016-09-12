import crypto from './crypto'
import axios from 'axios'
import Cookie from 'cookie'
import { stringify } from 'querystring'

const request: Axios.AxiosInstance = axios.create({
  baseURL: 'http://music.163.com',
  headers: {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip,deflate,sdch',
    'Accept-Language': 'zh-CN,en-US;q=0.7,en;q=0.3',
    'Connection': 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Host': 'music.163.com',
    'Referer': 'http://music.163.com/',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:39.0) Gecko/20100101 Firefox/39.0'
  }
})

export function setCookie (cookie: string[]): Axios.AxiosInstance {
  request.defaults.headers.common['Cookie'] = cookie.join('')
  return request
}

export function getCookie (): string {
  return request.defaults.headers.common['Cookie']
}

export function getUserID () {
  const cookie = request.defaults.headers.common['Cookie']
  if (!cookie) {
    return null
  }
  return /\d+/.exec(cookie[3])[0]
}

interface ILoginBody {
  password: string,
  rememberLogin: string,
  phone?: string,
  username?: string
}

export async function login (username: string, password: string): Promise<Axios.AxiosXHR<{}>> {
  const patten = /^0\d{2,3}\d{7,8}$|^1[34578]\d{9}$/
  let url = '/weapi/login/'
  let body: ILoginBody = {
    password: crypto.MD5(password),
    rememberLogin: 'true'
  }
  if (patten.test(username)) {
    body.phone = username
    url = '/weapi/login/cellphone/'
  } else {
    body.username = username
  }
  const encBody = crypto.encryptedRequest(body)
  return await request.post(url, stringify(encBody))
}

// use userPlayList() to get userProfile for now
// export async function userProfile (userId = getUserID()): Promise<Axios.AxiosXHR<{}>> {
//   if (!userId) {
//     return null
//   }
//   return await request.get('/api/user/detail/' + userId, {
//     params: {
//       userId
//     }
//   })
// }

export interface IPaginationParams {
  offset: number,
  limit: number,
  total?: boolean | string
}

export interface IPlayListParams extends IPaginationParams {
  uid: string
}

export async function userPlayList (params: IPlayListParams): Promise<Axios.AxiosXHR<{}>> {
  return await request.get('/api/user/playlist/', { params })
}

export async function playListDetail (id: string): Promise<Axios.AxiosXHR<{}>> {
  return await request.get('/api/playlist/detail', {
    params: { id }
  })
}

export const enum SearchType {
  song = 1,
  singer = 100,
  album = 10,
  songList = 1000,
  user = 1002
}

export interface ISearchBody extends IPaginationParams {
  s: string,
  type: SearchType | string
}

export async function search (body: ISearchBody): Promise<Axios.AxiosXHR<{}>> {
  return await request.post('/api/search/get/web', stringify(body))
}

export async function personalFM (): Promise<Axios.AxiosXHR<{}>> {
  return await request.get('/api/radio/get')
}

export async function recommnedPlayList (body: IPaginationParams): Promise<Axios.AxiosXHR<{}>> {
  if (!getCookie()) {
    return null
  }
  const csrf = Cookie.parse(getCookie())['HttpOnly__csrf']
  return await request
    .post('/weapi/v1/discovery/recommend/songs?csrf_token=' + csrf,
      stringify( crypto.encryptedRequest(
        Object.assign({}, body, { 'csrf_token': csrf })
      ) )
    )
}
