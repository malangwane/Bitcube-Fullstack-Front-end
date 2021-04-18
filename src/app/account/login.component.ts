import { Component, ElementRef, OnInit, ViewChildren } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControlName, FormGroup, Validators } from '@angular/forms';
import { debounceTime, first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';
import { WhitespaceValidator } from '@app/_validators';
import { MessageProcessor } from '@app/_helpers';
import { fromEvent, merge, Observable } from 'rxjs';

@Component({ templateUrl: 'login.component.html' })
export class LoginComponent implements OnInit {
    
    @ViewChildren(FormControlName, { read: ElementRef }) formInputElements: ElementRef[];
    
    form: FormGroup;
    msgProcessor: MessageProcessor;
    loading: boolean = false;
    returnUrl: string;
    passwordToggleMessage: string = 'show password';
    passwordInputType = 'password';

  
    maxChars: number = 100;
    emailMinChar: number = 6;

   
    displayMessage: { [key: string]: string } = {};
    validationMessages: { [key: string]: { [key: string]: string } } = {
        email: {
            required: 'Please enter your email address.',
            minlength: `Your email address must contain at least ${this.emailMinChar} characters.`,
            maxlength: `Your email address must contain less than ${this.maxChars} characters.`,
            email: 'Please enter a valid email address.'
        },
        password: {
            required: 'Please enter your chosen password.',
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

    ngOnInit() {
        this.form = this.formBuilder.group({
            email: ['', [WhitespaceValidator.removeSpaces, Validators.required, Validators.email,
                        Validators.minLength(this.emailMinChar), Validators.maxLength(this.maxChars)]],
            password: ['', [WhitespaceValidator.removeSpaces, Validators.required, 
                            Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,100}$/), Validators.maxLength(this.maxChars)]]
        });

       
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
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
            this.passwordToggleMessage = 'show password'
        } else {
            this.passwordInputType = 'text';
            this.passwordToggleMessage = 'hide password'
        }
    }
    
    onSubmit(): void {
        
        this.alertService.clear();

        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        this.accountService.login(this.form.get("email").value, this.form.get("password").value)
            .pipe(first())
            .subscribe(
                user => {
                    this.alertService.success("Login successfull", { autoClose: true, keepAfterRouteChange: true });
                    if (user.adminRole) {
                        this.router.navigate(['/admin/user-management']);
                    } else {
                    this.router.navigate(['/user-account/my-adverts']);
                    }
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                });
    }
}