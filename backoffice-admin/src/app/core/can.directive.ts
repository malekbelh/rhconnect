import {
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
  Injector,
  effect,
  EffectRef,
} from '@angular/core';
import { PermissionsService, PermissionKey } from './permissions.service';
import { AuthService } from './auth.service';

@Directive({
  selector: '[can]',
  standalone: true,
})
export class CanDirective implements OnInit, OnDestroy {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissions = inject(PermissionsService);
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private hasView = false;
  private effectRef?: EffectRef;

  @Input('can') permission!: PermissionKey;
  @Input('canElse') elseTemplateRef?: TemplateRef<unknown>;

  ngOnInit(): void {
    this.checkPermission();
    try {
      this.effectRef = effect(
        () => {
          this.auth.accessToken();
          this.auth.user();
          this.checkPermission();
        },
        { injector: this.injector }
      );
    } catch {
      // Safely ignore if called outside injection environment
    }
  }

  private checkPermission(): void {
    const granted = this.permissions.can(this.permission);
    if (granted && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!granted && this.hasView) {
      this.viewContainer.clear();
      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
      this.hasView = false;
    }
  }

  ngOnDestroy(): void {
    this.effectRef?.destroy();
    this.viewContainer.clear();
  }
}
