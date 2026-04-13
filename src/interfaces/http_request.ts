import { HttpHeader } from "./http_header";

export interface HttpRequest {
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    url: string;
    headers: HttpHeader[];
    body: string;
    contentType: 'none' | 'json' | 'form' | 'text' | 'xml';
}