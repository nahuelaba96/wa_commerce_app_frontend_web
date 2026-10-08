import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';

import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    MatSidenavModule,
    Navbar,
    Sidebar
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {}