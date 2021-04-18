﻿import { AfterViewInit, Component, ElementRef, OnInit, ViewChildren } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControlName, FormGroup, Validators } from '@angular/forms';
import { fromEvent, merge, Observable } from 'rxjs';
import { debounceTime, first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';
import { MessageProcessor } from '@app/_helpers';
import { WhitespaceValidator, MatchValidator } from '@app/_validators';
import { User } from '@app/_models';



@Component({ templateUrl: 'register.component.html' })
export class RegisterComponent implements OnInit, AfterViewInit {

    @ViewChildren(FormControlName, { read: ElementRef }) formInputElements: ElementRef[];

    form: FormGroup;
    msgProcessor: MessageProcessor;
    loading: boolean = false;
    passwordToggleMessage: string = 'show passwords';
    passwordInputType = 'password';
   

   
    maxChars: number = 100;
    firstNameMinChar: number = 1;
    lastNameMinChar: number = 3;
    emailMinChar: number = 6;

   
    displayMessage: { [key: string]: string } = {};
    validationMessages: { [key: string]: { [key: string]: string } } = {
        firstName: {
            required: 'Please enter your first name.',
            minlength: `Your first name must contain at least ${this.firstNameMinChar} characters.`,
            maxlength: `Your first name must contain less than ${this.maxChars} characters.`
        },
        lastName: {
            required: 'Please enter your last name.',
            minlength: `Your last name must contain at least ${this.lastNameMinChar} characters.`,
            maxlength: `Your last name must contain less than ${this.maxChars} characters.`
        },
        email: {
            required: 'Please enter your email address.',
            minlength: `Your email address must contain at least ${this.emailMinChar} characters.`,
            maxlength: `Your email address must contain less than ${this.maxChars} characters.`,
            email: 'Please enter a valid email address.'
        },
        passwordGroup: {
            match: ' Make sure the confirmation matches your password.',
        },
        password: {
            required: 'Please enter your chosen password.',
            maxlength: `Your password must contain less than ${this.maxChars} characters.`,
            pattern: 'Please enter a valid password.'
        },
        passwordConfirm: {
            required: 'Please confirm your password.',
            maxlength: `Your password must contain less than ${this.maxChars} characters.`,
            pattern: 'Please enter a valid password.'
        }
    };

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) {
        this.msgProcessor = new MessageProcessor(this.validationMessages);
    }

    ngOnInit(): void {
        
        this.form = this.formBuilder.group({
            firstName: ['', [WhitespaceValidator.removeSpaces, Validators.required,
            Validators.minLength(this.firstNameMinChar), Validators.maxLength(this.maxChars)]],
            lastName: ['', [WhitespaceValidator.removeSpaces, Validators.required,
            Validators.minLength(this.lastNameMinChar), Validators.maxLength(this.maxChars)]],
            email: ['', [WhitespaceValidator.removeSpaces, Validators.required, Validators.email,
            Validators.minLength(this.emailMinChar), Validators.maxLength(this.maxChars)]],
            passwordGroup: this.formBuilder.group({
                password: ['', [WhitespaceValidator.removeSpaces, Validators.required,
                Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,100}$/), Validators.maxLength(this.maxChars)]],
                passwordConfirm: ['', [WhitespaceValidator.removeSpaces, Validators.required,
                    Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,100}$/), Validators.maxLength(this.maxChars)]]
            })
        });

       
        const passwordFormGroup = this.form.get('passwordGroup');
        passwordFormGroup.setValidators(MatchValidator.match(passwordFormGroup.get('password'), passwordFormGroup.get('passwordConfirm')));
    }

    ngAfterViewInit(): void {
        
        const controlBlurs: Observable<any>[] = this.formInputElements
            .map((formControl: ElementRef) => fromEvent(formControl.nativeElement, 'blur'));
        
        merge(this.form.valueChanges, ...controlBlurs)
            .pipe(debounceTime(800))
            .subscribe(() => {
                this.displayMessage = this.msgProcessor.processMessages(this.form, null);
            });
    }

    showPassword(): void {
        if (this.passwordInputType === 'text') {
            this.passwordInputType = 'password';
            this.passwordToggleMessage = 'show passwords'
        } else {
            this.passwordInputType = 'text';
            this.passwordToggleMessage = 'hide passwords'
        }
    }

    onSubmit(): void {
        

        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        this.accountService.register(this.initUser())
            .pipe(first())
            .subscribe(
                user => {
                    this.alertService.success(`${user.firstName} ${user.lastName} registered successfully`, { keepAfterRouteChange: true });
                    this.form.reset();
                    this.router.navigate(['../login'], { relativeTo: this.route });
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                });
    }

    private initUser(): User {
        return {
            id: null,
            firstName: this.form.get('firstName').value,
            lastName: this.form.get('lastName').value,
            email: this.form.get('email').value,
            phoneNumber: null,
            password: this.form.get('passwordGroup.password').value,
            adminRole: false,
            locked: false,
            token: null
        };
    }
}