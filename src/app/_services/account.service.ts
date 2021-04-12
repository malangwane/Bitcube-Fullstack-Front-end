﻿import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { User } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class AccountService {
    private userSubject: BehaviorSubject<User>;
    public user: Observable<User>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.userSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('user')));
        this.user = this.userSubject.asObservable();
    }

    public get userValue(): User {
        return this.userSubject.value;
    }

    login(email: string, password: string ): Observable<User> {
        return this.http.post<User>(`${environment.apiUrl}/users/authenticate`, { email, password })
            .pipe(map(user => {
              
                localStorage.setItem('user', JSON.stringify(user));
                this.userSubject.next(user);
                return user;
            }));
    }

    logout() {

        localStorage.removeItem('user');
        this.userSubject.next(null);
        this.router.navigate(['/account/login']);
    }

    register(user: User): Observable<User> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json'});
        return this.http.post<User>(`${environment.apiUrl}/users/register`, user);
    }

    updateAccount(userId: number, user: User): Observable<User> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json'});
        return this.http.put<User>(`${environment.apiUrl}/users/${userId}`, user)
            .pipe(map(user => {
                user.token = this.userValue.token;
            
                localStorage.setItem('user', JSON.stringify(user));
                this.userSubject.next(user);
                return user;
            }));
    }

    checkUserPassword(userId: number, password: string): Observable<{}> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json'});
        return this.http.post(`${environment.apiUrl}/users/${userId}/password`, { password }, { headers })
    }

}